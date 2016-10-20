{
   "kind": "Template",
   "apiVersion": "v1",
   "metadata": {
      "name": "dhsanghv-java",
      "annotations": {
         "iconClass": "icon-jboss",
         "description": "Application template for hello world java application built using STI"
      }
   },
   "labels": {
      "application": "dhsanghv",
      "createdBy": "template-dhsanghv-java"
   },
   "parameters": [
      {
         "description": "The name for the application.",
         "name": "APPLICATION_NAME",
         "value": "dhsanghv"
      },
      {
         "description": "Custom hostname for service routes.  Leave blank for default hostname, e.g.: <application-name>.<project>.<default-domain-suffix>",
         "name": "APPLICATION_HOSTNAME"
      },
      {
         "description": "Git source URI for application",
         "name": "GIT_URI",
         "value": "https://github.com/giggityuser/custom-java-template.git"
      },
      {
         "description": "Git branch/tag reference",
         "name": "GIT_REF",
         "value": "master"
      },
      {
         "description": "Maven mirror url. If nexus is deployed locally, use nexus url (e.g. http://nexus.ci.apps.10.2.2.2.xip.io/content/groups/public/)",
         "name": "MAVEN_MIRROR_URL",
         "displayName": "Maven mirror url",
         "required": false
      },
      {
         "description": "Github trigger secret",
         "name": "GITHUB_TRIGGER_SECRET",
         "from": "[a-zA-Z0-9]{8}",
         "generate": "expression"
      },
      {
         "description": "Generic build trigger secret",
         "name": "GENERIC_TRIGGER_SECRET",
         "from": "[a-zA-Z0-9]{8}",
         "generate": "expression"
      }
   ],
   "objects": [
      {
         "kind": "BuildConfig",
         "apiVersion": "v1",
         "metadata": {
            "name": "${APPLICATION_NAME}"
         },
         "spec": {
            "triggers": [
               {
                  "type": "Generic",
                  "generic": {
                     "secret": "${GENERIC_TRIGGER_SECRET}"
                  }
               },
               {
                  "type": "GitHub",
                  "github": {
                     "secret": "${GITHUB_TRIGGER_SECRET}"
                  }
               },
               {
                  "type": "ImageChange",
                  "imageChange": {}
               }
            ],
            "source": {
               "type": "Git",
               "git": {
                  "uri": "${GIT_URI}",
                  "ref": "${GIT_REF}"
               }
            },
            "strategy": {
               "type": "Source",
               "sourceStrategy": {
                  "from": {
                     "kind": "ImageStreamTag",
                     "namespace": "openshift",
                     "name": "wildfly:latest"
                  },
                  "env": [
                     {
                        "name": "MAVEN_MIRROR_URL",
                        "value": "${MAVEN_MIRROR_URL}"
                     }
                  ]
               }
            },
            "output": {
               "to": {
                  "kind": "ImageStreamTag",
                  "name": "${APPLICATION_NAME}:latest"
               }
            }
         }
      },
      {
         "kind": "ImageStream",
         "apiVersion": "v1",
         "metadata": {
            "name": "${APPLICATION_NAME}"
         },
         "spec": {
            "dockerImageRepository": "",
            "tags": [
               {
                  "name": "latest"
               }
            ]
         }
      },
      {
         "kind": "DeploymentConfig",
         "apiVersion": "v1",
         "metadata": {
            "name": "${APPLICATION_NAME}",
            "labels": {
               "deploymentConfig": "${APPLICATION_NAME}"
            }
         },
         "spec": {
            "strategy": {
               "type": "Recreate"
            },
            "triggers": [
               {
                  "type": "ImageChange",
                  "imageChangeParams": {
                     "automatic": true,
                     "containerNames": [
                        "${APPLICATION_NAME}"
                     ],
                     "from": {
                        "kind": "ImageStreamTag",
                        "name": "${APPLICATION_NAME}:latest"
                     }
                  }
               },
               {
                  "type": "ConfigChange"
               }
            ],
            "replicas": 1,
            "selector": {
               "deploymentConfig": "${APPLICATION_NAME}"
            },
            "template": {
               "metadata": {
                  "labels": {
                     "deploymentConfig": "${APPLICATION_NAME}"
                  }
               },
               "spec": {
                  "containers": [
                     {
                        "name": "${APPLICATION_NAME}",
                        "image": "${APPLICATION_NAME}",
                        "ports": [
                           {
                              "name": "${APPLICATION_NAME}-http",
                              "containerPort": 8080,
                              "protocol": "TCP"
                           }
                        ],
                        "readinessProbe": {
                           "httpGet": {
                              "path": "/",
                              "port": 8080
                           }
                        },
                        "resources": {},
                        "terminationMessagePath": "/dev/termination-log",
                        "imagePullPolicy": "Always",
                        "securityContext": {
                           "capabilities": {},
                           "privileged": false
                        }
                     }
                  ],
                  "restartPolicy": "Always",
                  "dnsPolicy": "ClusterFirst"
               }
            }
         }
      },
      {
         "kind": "Route",
         "apiVersion": "v1",
         "metadata": {
            "name": "${APPLICATION_NAME}",
            "annotations": {
               "description": "Route for application's http service"
            }
         },
         "spec": {
            "host": "${APPLICATION_HOSTNAME}",
            "to": {
               "kind": "Service",
               "name": "${APPLICATION_NAME}"
            }
         }
      },
      {
         "kind": "Service",
         "apiVersion": "v1",
         "metadata": {
            "name": "${APPLICATION_NAME}",
            "annotations": {
               "description": "The web server's http port"
            }
         },
         "spec": {
            "ports": [
               {
                  "protocol": "TCP",
                  "port": 8080,
                  "targetPort": 8080
               }
            ],
            "selector": {
               "deploymentConfig": "${APPLICATION_NAME}"
            }
         }
      }
   ]
}