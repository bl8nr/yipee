import { Injectable, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { DownloadService } from '../shared/services/download.service';
import { YipeeFileService } from '../shared/services/yipee-file.service';
import { YipeeFileMetadata } from '../models/YipeeFileMetadata';

import { EditorEventService, InvalidKeysChangeEvent } from './editor-event.service';
import { K8sFile } from '../models/k8s/K8sFile';
import { Container } from '../models/common/Container';
import { ContainerGroup } from '../models/common/ContainerGroup';
import * as K8sService from '../models/k8s/Service';
import * as K8sVolume from '../models/common/Volume';
import { Ingress } from '../models/k8s/Ingress';
import { UnknownKind } from '../models/k8s/UnknownKind';
import { EmptyDirVolume } from '../models/common/EmptyDirVolume';
import { HostPathVolume } from '../models/common/HostPathVolume';
import { NameStringValue } from '../models/common/Generic';

@Injectable()
export class EditorService {

  private _dirty: boolean;
  editMode: string;
  readOnly: boolean;
  isWriter: boolean;
  yipeeFileID: string;
  metadata: YipeeFileMetadata;
  k8sFile: K8sFile = new K8sFile();
  yipeeFileLogo: string;
  fatalText: string[];
  alertText: string[];
  infoText: string[];
  invalidKeys: string[];
  nerdModeType: string;
  showReadmeDialog = new Subject<any>();

  @Output() onContainerAdd = new EventEmitter<Container>();

  /**
     * cached items
     * these are vars that are cached to make things a bit more efficient
     * they are things whose return requires iteration over a potentially
     * infinite number of objects, so we only update them on command
    */
  private _service_map = [];

  constructor(
    private editorEventService: EditorEventService,
    private yipeeFileService: YipeeFileService,
    private downloadService: DownloadService
  ) {
    this._dirty = false;
    this.editMode = '';
    this.readOnly = false;
    this.isWriter = false;
    this.fatalText = [];
    this.alertText = [];
    this.infoText = [];
    this.invalidKeys = [];
    this.nerdModeType = undefined;

    /** Editor Event Service Subscribers
     * these live in the constructor, the only lifecycle method for services really
     * this is for things the editor service has to listen to to do any advanced logic
     * between objects in the model. The angular way, not the java way.
     */
    this.editorEventService.onServiceModelOnRefresh.subscribe(() => {
      // a services model has changed so we....
      this.initPodServiceNames();
    });

  }

  setShowReadme(value: boolean): void {
    if (!value) {
      this.editorEventService.onGenericTrack.emit('CloseReadme');
    }
    this.showReadmeDialog.next(value);
  }

  getShowReadme(): Observable<boolean> {
    return this.showReadmeDialog.asObservable();
  }

  downloadCurrentModel(): void {
    this.downloadService.downloadKubernetesFile(true, this.k8sFile.toFlat());
  }

  downloadKubernetes(): void {
    this.downloadService.downloadKubernetesFile(true, this.k8sFile.toFlat());
  }

  downloadKubernetesArchive(): void {
    this.downloadService.downloadKubernetesArchive(true, this.k8sFile.toFlat());
  }

  downloadHelm(): void {
    this.downloadService.downloadHelmArchive(true, this.k8sFile.toFlat());
  }

  dumpK8sFile() {
    console.log(this.k8sFile.toFlat());
    console.log(this.k8sFile);
  }

  reportInvalidForm(key: string, value: boolean): void {
    const index = this.invalidKeys.indexOf(key);
    if (value) {
      if (index === -1) {
        this.invalidKeys.push(key);
        this.editorEventService.onInvalidKeysChange.emit(new InvalidKeysChangeEvent(this.invalidKeys));
      }
    } else {
      this.removeInvalidFormKey(key);
    }
  }

  removeInvalidFormKey(key: string): void {
    const index = this.invalidKeys.indexOf(key);
    if (index !== -1) {
      this.invalidKeys.splice(index, 1);
      this.editorEventService.onInvalidKeysChange.emit(new InvalidKeysChangeEvent(this.invalidKeys));
    }
  }

  hasError(): boolean {
    return (this.invalidKeys.length !== 0);
  }

  loadYipeeFile(yipeeFile: YipeeFileMetadata): Observable<boolean> {
    this.fatalText.length = 0;
    this.alertText.length = 0;
    this.infoText.length = 0;
    this.invalidKeys.length = 0;
    this.metadata = yipeeFile;
    this.k8sFile = yipeeFile.flatFile;
    this.editMode = this.getEditMode();
    return Observable.of(true);
  }

  saveYipeeFile(): Observable<boolean> {
    return this.yipeeFileService.update(this.metadata).map((metadata: YipeeFileMetadata) => {
      this.metadata.dateCreated = metadata.dateCreated;
      this.metadata.dateModified = metadata.dateModified;
      this.metadata.revcount = metadata.revcount;
      return true;
    });
  }

  getYipeeFileLogo(): Observable<boolean> {
    this.yipeeFileLogo = undefined;
    return this.yipeeFileService.getYipeeFileLogo(this.yipeeFileID).map((base64Img) => {
      this.yipeeFileLogo = base64Img;
      return true;
    });
  }

  saveYipeeFileLogo(): Observable<boolean> {
    return this.yipeeFileService.putYipeeFileLogo(this.yipeeFileID, this.yipeeFileLogo).map((response) => {
      return response;
    });
  }

  newK8sEmptyDirVolume(volume?: EmptyDirVolume): EmptyDirVolume {
    if (volume === undefined) {
      volume = new EmptyDirVolume();
    }
    this.k8sFile.push(volume);
    this.dirty = true;
    volume.ui.canvas.position = { x: 100, y: 100 };
    return volume;
  }

  newK8sHostPathVolume(volume?: HostPathVolume): HostPathVolume {
    if (volume === undefined) {
      volume = new HostPathVolume();
    }
    this.k8sFile.push(volume);
    this.dirty = true;
    volume.ui.canvas.position = { x: 100, y: 100 };
    return volume;
  }

  newK8sVolume(volume?: K8sVolume.Volume): K8sVolume.Volume {
    if (volume === undefined) {
      volume = new K8sVolume.Volume();
    }
    this.k8sFile.push(volume);
    this.dirty = true;
    volume.ui.canvas.position = { x: 100, y: 100 };
    return volume;
  }

  newK8sService(service?: K8sService.Service): K8sService.Service {
    if (service === undefined) {
      service = new K8sService.Service();
    }
    this.k8sFile.push(service);
    this.dirty = true;
    service.ui.canvas.position = { x: 100, y: 100 };
    return service;
  }

  newK8sIngress(ingress?: Ingress): Ingress {
    if (ingress === undefined) {
      ingress = new Ingress();
    }
    this.k8sFile.push(ingress);
    this.dirty = true;
    ingress.ui.canvas.position = { x: 100, y: 100 };
    return ingress;
  }

  newK8sUnknownKind(unknownKind?: UnknownKind): UnknownKind {
    unknownKind = new UnknownKind();
    this.k8sFile.push(unknownKind);
    this.dirty = true;
    unknownKind.ui.canvas.position = { x: 100, y: 100 };
    return unknownKind;
  }

  addContainer(container: Container): void {
    this.k8sFile.push(container);
    this.dirty = true;
    container.ui.canvas.position = { x: 100, y: 100 };
    this.onContainerAdd.emit(container);
  }

  newContainer(container?: Container): Container {
    if (container === undefined) {
      container = new Container();
    }
    this.k8sFile.push(container);
    this.dirty = true;
    container.ui.canvas.position = { x: 100, y: 100 };
    return container;
  }

  addContainerToContainerGroup(container: Container, containerGroup: ContainerGroup): void {
    containerGroup.addContainer(container);
    this.dirty = true;
  }

  removeContainerFromContainerGroup(container: Container, containerGroup: ContainerGroup): void {
    containerGroup.removeContainer(container);
    this.dirty = true;
  }

  cloneContainer(container: Container): Container {
    return this.newContainer();
  }

  newContainerGroup(containerGroup?: ContainerGroup): ContainerGroup {
    if (containerGroup === undefined) {
      containerGroup = new ContainerGroup();
      this.k8sFile.push(containerGroup);
    }
    this.dirty = true;
    containerGroup.ui.canvas.position = { x: 100, y: 100 };
    containerGroup.source = 'k8s';
    this.reportInvalidForm(containerGroup.id, (containerGroup.container_count === 0));
    return containerGroup;
  }

  cloneContainerGroup(containerGroup: ContainerGroup): ContainerGroup {
    return this.newContainerGroup();
  }

  getUniqueName(base: string, source: any[]): string {
    if (source === undefined) {
      return base + '-0';
    }
    const existing = source.map(a => a.name);

    // if base is already already unique, return it

    if (existing.indexOf(base) === -1) {
      return base;
    }

    let suffix = 0;
    let name = base + '-' + suffix;
    let unique = false;
    while (!unique) {
      if (existing.indexOf(name) !== -1) {
        suffix++;
        name = base + '-' + suffix;
        continue;
      }
      unique = true;
    }
    return name;
  }


  getEditMode(): string {
    if (this.metadata.isFlat) {
      return 'k8s';
    }
    return 'compat';
  }

  getModelType(): string {
    if (this.metadata.flatFile) {
      return 'k8s';
    } else {
      return 'c11y';
    }
  }

  // go through the container group service names and clear them if the corresponding service no longer exists
  private initPodServiceNames(): void {
    this.k8sFile.containerGroups.forEach((containerGroup: ContainerGroup) => {
      const serviceNameExistsInServiceMap = _.findWhere(this.returnServiceMapByContainerGroupId(containerGroup.id), { name: containerGroup.deployment_spec.service_name });

      if (!serviceNameExistsInServiceMap) {
        containerGroup.deployment_spec.service_name = '-- Select a service --';
      }

    });
  }

  /* SERVICE_MAP */
  returnServiceMapByContainerGroupId(containerGroupId) {
    const serviceMap = [];
    this.k8sFile.services.forEach((service) => {
      const matchesContainerGroup = _.find(service.container_groups, { id: containerGroupId });

      if (matchesContainerGroup) {
        serviceMap.push(new NameStringValue(service.name, service.id));
      }
    });

    return serviceMap;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  set dirty(value: boolean) {
    this._dirty = value;
  }

}
