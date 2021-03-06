(ns composecvt.api
  (:gen-class)
  (:require [liberator.core :refer [resource defresource]]
            [liberator.representation :refer [ring-response]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.adapter.jetty :as jetty]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [clojure.data.json :as json]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [compojure.core :refer [routes ANY]]
            [clj-yaml.core :as yaml]
            [engine.core :refer :all]
            [clojure.pprint :as pprint]
            [k8scvt.api :as k8s]
            [k8scvt.util :as util]
            [composecvt.compose-to-flat]
            [composecvt.flat-to-compose]
            [composecvt.validators :as v]))

(defn body-as-string
  [ctx]
  (if-let [body (get-in ctx [:request :body])]
    (condp instance? body
      java.lang.String body
      (slurp (io/reader body)))))

(defn wmes-of-type [srclist typ]
  (filter #(= (:type %) typ) srclist))

(defn results-and-errors [wmes]
  (let [results wmes
        errors (wmes-of-type results :validation-error)]
    (if (empty? errors)
      [results true]
      [errors false])))

(defn do-convert [converter valid-results]
  (let [retlist (converter :run-list valid-results)]
    {::retval (dissoc (first retlist) :type)}))

(defn return-errors [results]
  (let [errmsgs (str/join
                 "\n" (map util/format-validation-error results))]
    {::reterr errmsgs}))

(defn cvtc2f [composeobj]
  (binding [util/*wmes-by-id* (atom {})]
    (let [to-flat (engine :composecvt.compose-to-flat)
          inputobj (list (assoc composeobj :type :compose))
          results (to-flat :run-list inputobj)]
      {::retval (group-by :type results)})))

(defn load-and-validate-import [ctx]
  (let [body (k8s/b64decode-if-possible (body-as-string ctx))
        [pobj perr] (try
                      [(yaml/parse-string body) nil]
                      (catch Exception e
                        [nil "Invalid compose file: can't parse"]))
        verrs (when pobj
                (try
                  (v/validate pobj)
                  (catch Exception e
                    "Invalid compose file: can't validate")))]
    [pobj (remove nil? (flatten [perr verrs]))]))

(defn compose-to-flat [ctx]
  (let [[composeobj errors] (load-and-validate-import ctx)]
    (if (> (count errors) 0)
      {::reterr (str/join "\n" errors)}
      (cvtc2f composeobj))))

(defresource c2f
  :allowed-methods [:post]
  :available-media-types ["application/json"]
  :post! compose-to-flat
  :handle-created (fn [ctx]
                    (if (contains? ctx ::retval)
                      (json/write-str (::retval ctx))
                      (ring-response {:body (::reterr ctx) :status 422}))))

(def api-routes
  (routes
   (ANY "/c2f" [] c2f)
   (route/not-found (format (json/write-str {:message "Page not found"})))))

(def handler
  (-> api-routes
      handler/api
      wrap-params))

(defn start []
  (jetty/run-jetty #'handler {:port 3000 :join? false}))
