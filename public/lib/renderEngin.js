var __errMsgObj = {
    "p01": {
        "err": "Invalid JSON",
        "message": "Not a valid JSON schema"
    },
    "p02": {
        "err": "Invalid JSON",
        "message": "Not a valid JSON object"
    },
    "p03": {
        "err": "Error in parsing json schema",
        "message": "Not a valid JSON schema"
    },
    "p04": {
        "err": "Error in parsing json schema array",
        "message": "Array has invalid json schema at location : ",
        "errDetails": []
    },
    "r01": {
        "err": "Invalid json schema",
        "message": "First level data type of schema is always object"
    },
    "r02": {
        "err": "Error in procssing json schema",
        "message": "Not a valid data type of json schema"
    },
    "r03": {
        "err": "Error in parsing json schema",
        "message": "Not a valid JSON schema"
    }
};

function deReferenceJSONSchema(schemaObj, cb) {
    try {
        $RefParser.dereference(schemaObj, function (err, schema) {
            if (err) {
                cb(null, err);
            } else {
                delete schema.$ref;
                cb(schema)
            }
        });
    } catch (e) {
        cb(null, e);
    }
};

angular.module('renderEngin', [])
    .factory('JSchemaPareser', ['$q', function ($q) {
        var jschemaElement;
        var jschemaArray = [];
        //jschemaElement.anyTypePaths = []
        function traverseSchema(schemaNode, model, cb) {
            var formElems;

            var retHTML = "";

            if (!model || model == "") {
                model = "cust" + jschemaElement._id
            }

            if (schemaNode.type == 'object') {
                formElems = schemaNode.properties;
            } else if (schemaNode.type == 'array') {
                formElems = schemaNode.items.properties;
            } else {
                formElems = schemaNode;
            }

            if (formElems) {

                var formElemsKeys = Object.keys(formElems);

                for (var i = 0; i < formElemsKeys.length; i++) {
                    formElem = formElems[formElemsKeys[i]];
                    var loopModel = model + "." + formElemsKeys[i];

                    if (Object.keys(formElem).length == 0) {
                        if (!jschemaElement.anyTypePaths) {
                            jschemaElement.anyTypePaths = [loopModel];
                        } else {
                            jschemaElement.anyTypePaths.push(loopModel);
                        }
                    }

                    if (formElem.type && (formElem.type == "array" || formElem.type == "object")) {
                        if (formElem.type == "array") {
                            retHTML += '<div type:"' + formElem.type + '" model="' + loopModel + '">';
                            loopModel = "item";
                        } else {
                            retHTML += '<div type:"' + formElem.type + '">';
                        }

                        retHTML += traverseSchema(formElem, loopModel);
                        retHTML += '</div>';

                    } else if (formElem.type) {
                        // RENDER HERE
                        //retHTML += renderFormElem(formElem, parentType, aarOrObj, loopModel);
                    }
                }
                if (cb) {
                    cb();
                } else {
                    return (retHTML);
                }

            }
        }

        function checkSchema(schemaArr, cb) {
            jschemaElement = schemaArr.pop();
            traverseSchema(jschemaElement.dereferencedSchema, null, function () {
                jschemaArray.push(jschemaElement);
                if (schemaArr.length > 0) {
                    checkSchema(schemaArr, cb);
                } else {
                    cb();
                }
            });
        }


        function traverseSchemaForMerge(schemaNode, model, mergeElement, cb) {
            var formElems;

            var retHTML = "";

            if (!model || model == "") {
                model = "cust" + jschemaElement._id
            }

            if (schemaNode.type == 'object') {
                formElems = schemaNode.properties;

            } else if (schemaNode.type == 'array') {
                formElems = schemaNode.items.properties;

            } else {
                formElems = schemaNode;
            }

            if (formElems) {

                var formElemsKeys = Object.keys(formElems);

                for (var i = 0; i < formElemsKeys.length; i++) {

                    formElem = formElems[formElemsKeys[i]];
                    var loopModel = model + "." + formElemsKeys[i];

                    if (formElem.type && (formElem.type == "array" || formElem.type == "object")) {
                        formElems = traverseSchemaForMerge(formElem, loopModel, mergeElement);
                    }

                    if (mergeElement.objectPath == loopModel) {
                        formElems[formElemsKeys[i]] = mergeElement.schema
                    }
                }
                if (cb) {
                    cb(schemaNode);
                } else {
                    return (formElems);
                }

            }
        }

        function mergeSchema2(Jobj, cb) {
            var element = Jobj.dataArray.pop();
            traverseSchemaForMerge(Jobj.dereferencedSchema, null, element, function (schema) {
                //console.log('schema === '+JSON.stringify(schema));
                Jobj.dereferencedSchema = schema;
                if (Jobj.dataArray.length > 0) {
                    mergeSchema2(Jobj, cb);
                } else {
                    cb(Jobj);
                }
            });
            //jschemaElement.objectPath
            //jschemaElement.schema
        }

        function mergeSchema(schemaArr, mergedArr, cb) {
            var jsObject = schemaArr.pop();
            jschemaElement = jsObject
            jsObject.updatedDataArray = angular.copy(jsObject.dataArray);
            mergeSchema2(jsObject, function (updatedOject) {
                mergedArr.push(updatedOject);
                if (schemaArr.length > 0) {
                    mergeSchema(schemaArr, mergedArr, cb);
                } else {
                    cb(mergedArr);
                }
            });
        }

        return {
            deReferenceSchema: function (JSON_Schema) {
                return $q(function (resolve, reject) {
                    if (!JSON_Schema)
                        reject(__errMsgObj['p01']);

                    if (typeof JSON_Schema != "object")
                        reject(__errMsgObj['p02']);

                    try {
                        var testJsonObj = JSON.parse(JSON.stringify(JSON_Schema))
                    } catch (e) {
                        __errMsgObj['p02'].errDetails = e;
                        reject(__errMsgObj['p02']);
                    }
                    if ($.isArray(JSON_Schema)) {
                        var dereferencedSchemasArray = [];
                        var counter = 0
                        for (var i = 0; i < JSON_Schema.length; i++) {
                            deReferenceJSONSchema(JSON_Schema[i], function (pass1DereferencedSchema, err) {
                                if (err) {
                                    __errMsgObj['p04'].errDetails.push(e);
                                    __errMsgObj['p04'].message += i;
                                    reject(__errMsgObj);
                                } else {
                                    deReferenceJSONSchema(pass1DereferencedSchema, function (dereferencedSchema, err) {
                                        if (err) {
                                            __errMsgObj['p04'].errDetails.push(e);
                                            __errMsgObj['p04'].message += i;
                                            reject(__errMsgObj);
                                        } else {
                                            counter++;
                                            delete dereferencedSchema.definitions;
                                            dereferencedSchemasArray.push(dereferencedSchema);
                                            if (counter == JSON_Schema.length) {
                                                resolve(dereferencedSchemasArray);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    } else {
                        deReferenceJSONSchema(JSON_Schema, function (pass1DereferencedSchema, err) {
                            if (err) {
                                __errMsgObj['p03'].errDetails = err;
                                reject(__errMsgObj['p03']);
                            }
                            deReferenceJSONSchema(pass1DereferencedSchema, function (dereferencedSchema, err) {
                                if (err) {
                                    __errMsgObj['p03'].errDetails = err;
                                    reject(__errMsgObj['p03'])
                                }
                                delete dereferencedSchema.definitions;
                                resolve(dereferencedSchema);
                            });
                        });
                    }
                });
            },
            checkSchemaForANYType: function (schemaArr) {
                return $q(function (resolve, reject) {
                    checkSchema(schemaArr, function () {
                        //console.log('jschemaArray ==== '+JSON.stringify(jschemaArray));
                        resolve(jschemaArray);
                    });
                });
            },
            mergeJSchema: function (schemaArr) {
                return $q(function (resolve, reject) {
                    mergeSchema(schemaArr, [], function (mergedArr) {
                        resolve(mergedArr);
                    });
                });
            }
        };
    }]).factory('UIBuilder', ['$q', '$rootScope', function ($q, $rootScope) {

        var moduleId;

        var analyseRequiredBoxesCSS = function (JSchema) {
            return $q(function (resolve, reject) {
                //console.log('JSchema ===== ' + JSON.stringify(JSchema));
                var boxUIArry = [];
                var isAnyType = false;
                var isAVP = false;

                var keysArray = Object.keys(JSchema.properties);

                if (keysArray.length > 0) {

                    for (var i = 0; i < keysArray.length; i++) {
                        if (keysArray[i] == "avpList") {
                            delete JSchema.properties[keysArray[i]];
                            isAVP = true;
                        } else {
                            var copyKey = angular.copy(keysArray[i])
                            copyKey = copyKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                                return str.toUpperCase();
                            });
                            if (JSchema.properties[keysArray[i]].type == "object") {

                                var innerKeysArr = Object.keys(JSchema.properties[keysArray[i]].properties);

                                if (innerKeysArr.indexOf("measurementUnitCode") > -1) {
                                    JSchema.properties[keysArray[i]].uiStyle = "measurementUnit";
                                } else {
                                    JSchema.properties[keysArray[i]].uiStyle = "complex";
                                    JSchema.properties[keysArray[i]].boxDisplayName = copyKey
                                }


                                if (innerKeysArr.length > 0) {
                                    // if complex object then only new box
                                    for (var j = 0; j < innerKeysArr.length; j++) {
                                        if (innerKeysArr[j] == "avpList") {
                                            JSchema.properties[keysArray[i]].isAvpList = true;
                                            delete JSchema.properties[keysArray[i]].properties[innerKeysArr[j]];
                                        } else {
                                            if (JSchema.properties[keysArray[i]] && JSchema.properties[keysArray[i]].properties[innerKeysArr[j]].type == "array") {
                                                /*var arrProps = Object.keys(JSchema.properties[keysArray[i]].properties[innerKeysArr[j]].items.properties)
                                                if (arrProps && arrProps.indexOf("languageCode") == -1) {
                                                    var schemaCopy = angular.copy(JSchema);
                                                    schemaCopy.properties = {};
                                                    schemaCopy.properties[keysArray[i]] = angular.copy(JSchema.properties[keysArray[i]]);
                                                    schemaCopy.properties[keysArray[i]].properties = {};
                                                    schemaCopy.properties[keysArray[i]].properties[innerKeysArr[j]] = angular.copy(JSchema.properties[keysArray[i]].properties[innerKeysArr[j]]);
                                                    schemaCopy.properties[keysArray[i]].uiStyle = "complex";
                                                    var boxtitle = angular.copy(innerKeysArr[j]);
                                                    boxtitle = boxtitle.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                                                        return str.toUpperCase();
                                                    });
                                                    schemaCopy.properties[keysArray[i]].boxDisplayName = boxtitle;
                                                    boxUIArry.push(schemaCopy);
                                                   // delete JSchema.properties[keysArray[i]].properties[innerKeysArr[j]];

                                                } else {*/
                                                var schemaCopy = angular.copy(JSchema);
                                                schemaCopy.properties = {};
                                                schemaCopy.properties[keysArray[i]] = angular.copy(JSchema.properties[keysArray[i]]);
                                                schemaCopy.properties[keysArray[i]].boxDisplayName = copyKey;
                                                schemaCopy.properties[keysArray[i]].uiStyle = "complex";
                                                delete JSchema.properties[keysArray[i]];
                                                boxUIArry.push(schemaCopy);
                                                //}
                                            }
                                            if (JSchema.properties[keysArray[i]] && JSchema.properties[keysArray[i]].properties[innerKeysArr[j]].type == "object") {
                                                var schemaCopy = angular.copy(JSchema);
                                                schemaCopy.properties = {}
                                                schemaCopy.properties[keysArray[i]] = angular.copy(JSchema.properties[keysArray[i]]);
                                                schemaCopy.properties[keysArray[i]].uiStyle = "complex";
                                                schemaCopy.properties[keysArray[i]].boxDisplayName = copyKey;
                                                schemaCopy.properties[keysArray[i]].properties = {};
                                                schemaCopy.properties[keysArray[i]].properties[innerKeysArr[j]] = angular.copy(JSchema.properties[keysArray[i]].properties[innerKeysArr[j]]);
                                                delete JSchema.properties[keysArray[i]].properties[innerKeysArr[j]];
                                                boxUIArry.push(schemaCopy);
                                            }
                                        }
                                    }

                                    if (JSchema.properties[keysArray[i]] && JSchema.properties[keysArray[i]].properties && Object.keys(JSchema.properties[keysArray[i]].properties).length == 0) {
                                        delete JSchema.properties[keysArray[i]];
                                    }

                                } else {
                                    alert("Invalid schema uploaded");
                                    reject();
                                }
                            } else if (JSchema.properties[keysArray[i]].type == "array") {
                                // all array are single boxes
                                // Fix for array with no properties in json schema : Jan 12 2017
                                if (!JSchema.properties[keysArray[i]].items.properties) {
                                    JSchema.properties[keysArray[i]].items.properties = {};
                                    JSchema.properties[keysArray[i]].items.properties['value'] = JSchema.properties[keysArray[i]].items
                                }
                                // Fix end for array with no properties in json schema : Jan 12 2017
                                var arryElementKeys = Object.keys(JSchema.properties[keysArray[i]].items.properties)
                                if (arryElementKeys.length == 3 && arryElementKeys.indexOf("codeListVersion") > -1 && arryElementKeys.indexOf("value") > -1 && arryElementKeys.indexOf("languageCode") > -1) {
                                    // do nothing
                                    JSchema.properties[keysArray[i]].type1LanguageUI = true
                                    JSchema.properties[keysArray[i]].uiStyle = "complex"
                                } else {
                                    var schemaCopy = angular.copy(JSchema);
                                    schemaCopy.properties = {};
                                    schemaCopy.properties[keysArray[i]] = angular.copy(JSchema.properties[keysArray[i]]);
                                    schemaCopy.properties[keysArray[i]].boxDisplayName = copyKey;
                                    schemaCopy.properties[keysArray[i]].uiStyle = "complex";
                                    delete JSchema.properties[keysArray[i]];
                                    boxUIArry.push(schemaCopy);
                                }

                            } else {
                                // Handle for any type data who not need a box UI
                                if (Object.keys(JSchema.properties[keysArray[i]]).length == 0) {
                                    isAnyType = true;
                                }
                            }
                        }
                    }
                    if (Object.keys(JSchema.properties).length > 0) {
                        boxUIArry.push(JSchema);
                    }

                    resolve({
                        "data": boxUIArry,
                        "avpFlag": isAVP,
                        "isAnyTypePresent": isAnyType
                    });

                } else {
                    alert("Invalid schema uploaded");
                    reject();
                }

            });
        };

        var pass2HtmlTemplates = {
            'selectDropDown': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as selectBoxItem.name for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'selectDropDownMeasurementUnitCode': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as (selectBoxItem.name + \' ( \'+ selectBoxItem.value + \' )\' ) for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><option value="" >{{label[\'select measurement unit\']}}</option></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'selectDropDownImageTypeCode': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as selectBoxItem.name for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><option value="" >{{label[\'selectImageTypeCode\']}}</option></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'selectDropDownLanguageCode': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as selectBoxItem.name for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><option value="" >{{label[\'SelectLanguageCode\']}}</option></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'string': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="text" ng-model="FILL_MODEL_NAME" ng-readonly="ValuesReadOnly" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'number': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="number" ng-model="FILL_MODEL_NAME" ng-readonly="ValuesReadOnly" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'boolean': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="checkbox" ng-model="FILL_MODEL_NAME" ng-readonly="ValuesReadOnly" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'integer': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="number" ng-model="FILL_MODEL_NAME" ng-readonly="ValuesReadOnly" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'Arraystring': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control " type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'Arraynumber': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="number" ng-readonly="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'Arrayinteger': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><input class="form-control" type="number" ng-readonly="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL65\']}}"LableValue"</span></div></div></div>',
            'ArrayselectDropDown': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as selectBoxItem.name for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'ArrayselectDropDownLanguageCode': '<div class="row"><div class="col-md-12"><div class="form-group"><label class="control-label IS_REQUIRED_FIELD">LableValue</label><select class="form-control" ng-disabled="ValuesReadOnly" ng-model="FILL_MODEL_NAME" ng-options="selectBoxItem.value as selectBoxItem.name for selectBoxItem in FILL_LIST_NAME | orderBy:\'name\'" ng-class="{errElementBorder: MODEL_ERR_FLAG && !FILL_MODEL_NAME}"><option value="" >{{label[\'SelectLanguageCode\']}}</option></select><span class="errMsgSpan" ng-if="MODEL_ERR_FLAG && !FILL_MODEL_NAME">{{message[\'VAL66\']}}"LableValue"</span></div></div></div>',
            'boxstart': '<div class="row UI_COLUMN_STYLE" style="UIWIDTHADJUST"><div class="col-md-12"><div class="ibox float-e-margins"><div class="ibox-title"><h5><lable class="IS_REQUIRED_FIELD_ELEMENT">parsedLabel</lable></h5><div class="ibox-tools"><a class="collapse-link" ng-click="slider($event)"><i class="fa fa-chevron-up"></i></a></div></div><div class="ibox-content" id="fieldId">',
            'boxend': '</div></div></div></div>',
            'arraystart': '<div class="row"><div class="col-md-12"><label class="label-control">ARRAY_LABEL</label></div><div class="col-md-offset-1 col-md-10" ng-repeat="item in FILL_DATASET_NAME" style="border: solid 1px;margin-bottom: 10px;border-color: #e7eaec;"><div class="col-md-offset-1 col-md-11 " style="margin-top: 1%;padding-right: 0;min-height:25px;"><div class="col-lg-2 col-md-2 col-sm-2 pull-right HIDEAVPLISTSYMBOL" style="padding: 0;"><a ng-click="showCustomAVPModal(item.avpList.stringAVP,\'item.avpList.stringAVP\',\'stringAVP\',item)"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning">{{item.avpList.stringAVP.length}}</span></a></div><div class="col-md-offset-8 col-md-2 pull-right" style="text-align: right" ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,FILL_DATASET_NAME,$parent.$parent.item,\'FILL_DATASET_LABLE_NAME\',$parent.$parent,item)"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></div></div>',
            'arrayend': '</div><div class="col-md-12" ng-if="!ValuesReadOnly"><a ng-click="addItem(FILL_DATASET_NAME,item,\'FILL_DATASET_LABLE_NAME\',MODULEID,\'FILL_DATASET_NAME\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>',


        }


        function getPass2Template(type, fromElement, model, lable, optionsList, isArray) {
            if (lable == 'codeListVersion') {
                return '';
            } else {
                var templte = '';
                if (lable == "languageCode") {
                    templte = pass2HtmlTemplates['ArrayselectDropDownLanguageCode'];
                    templte = templte.replace(/FILL_LIST_NAME/g, 'langCodeList');

                } else {
                    templte = pass2HtmlTemplates[type];
                }

                /*if(isArray && isArray == "Array"){
                     templte = templte.replace();
                 }*/

                /*if (fromElement.maxLength) {
                    templte = templte.replace('REPLACE_MAXLENGTH', fromElement.maxLength);
                }
                if (fromElement.minLength) {
                    templte = templte.replace('REPLACE_MINLENGTH', fromElement.minLength);
                }
                if (fromElement.requiredElement) {
                    templte = templte.replace(/IS_REQUIRED_FIELD/g, 'qagRequired');
                }
                if (optionsList) {
                    templte = templte.replace('FILL_LIST_NAME', optionsList);
                }
                parsedLabel = lable.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                    return str.toUpperCase();
                });
                templte = templte.replace(/LableValue/g, parsedLabel);
                templte = templte.replace(/FILL_MODEL_NAME/g, model);
                templte = templte.replace(/MODEL_ERR_FLAG/g, model + "Err");*/


                templte = templte.replace(/FILL_MODEL_NAME/g, model);
                parsedLabel = lable.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                    return str.toUpperCase();
                });
                templte = templte.replace(/LableValue/g, parsedLabel);

                return templte;
            }
        }

        var loopModelCopy;
        var arrayNgModelLang;

        function getPass2TemplateForLanguageCode(type, loopModel) {
            var htm = '';
            if (type == "start") {
                arrayNgModelLang = angular.copy(loopModel);
                var langModel = loopModel.substr(loopModel.lastIndexOf('.') + 1);
                var langModelStr = langModel + 'langCode';
                loopModelCopy = angular.copy(langModelStr);
                //var langdivhtml = '<div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right"><div class="btn-group btn-group-xs"><span ng-if="ValuesReadOnly == true && ' + loopModel + '.length == 0">{{label[\'add\']}}</span><span  ng-if="ValuesReadOnly == false || ' + loopModel + '.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="UPDATELANGUAGECODEMODEL != label[\'add\']" ng-src="{{imageUrlPrefix}}/flags/{{UPDATELANGUAGECODEMODEL}}.png" class="langFlags">{{UPDATELANGUAGECODEMODEL || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in ' + loopModel + ' | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'UPDATELANGUAGECODEMODEL\',item.languageCode)"><img ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly"><a ng-click="deleteLanguage(item.languageCode,' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddLanguageCustom(' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')">{{label["addLanguage"]}}</a></li></ul></span></div></div>';
                var langdivhtml = '<div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right"><div class="btn-group btn-group-xs"><span ng-if="ValuesReadOnly == true && ' + loopModel + '.length == 0">{{label[\'add\']}}</span><span ng-if="ValuesReadOnly == false || ' + loopModel + '.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="UPDATELANGUAGECODEMODEL != label[\'add\']" ng-hide="UPDATELANGUAGECODEMODEL == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{UPDATELANGUAGECODEMODEL}}.png" class="langFlags">{{UPDATELANGUAGECODEMODEL || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in ' + loopModel + ' | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'UPDATELANGUAGECODEMODEL\',item.languageCode)"><img ng-hide="item.languageCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly"><a ng-click="deleteLanguage(item.languageCode,' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddLanguageCustom(' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')">{{label["addLanguage"]}}</a></li></ul></span></div></div>'
                langdivhtml = langdivhtml + '<div style="padding: 0;" class="col-lg-10 col-md-10 col-sm-10 col-xs-10" ng-if="(ValuesReadOnly == true && ' + loopModel + '.length == 0) || (' + loopModel + '.length == 0)"><input class="form-control" type="text" disabled readonly ng-model="x"></div>'
                langdivhtml = langdivhtml.replace(/UPDATELANGUAGECODEMODEL/g, langModelStr)
                var arrytemplate = '<div class="row" style="margin-bottom:3%"><div class="col-md-offset-1 col-md-10" ng-repeat="item in ' + loopModel + '" ng-if="item.languageCode == ' + langModelStr + '" style="border: solid 1px;margin-bottom: 10px;border-color: #e7eaec;"><div class="col-md-offset-1 col-md-11 " style="margin-top: 1%;padding-right: 0;min-height:25px;"><div class="col-md-offset-8 col-md-2 pull-right" style="text-align: right" ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,' + loopModel + ',$parent.$parent.item,\'FILL_DATASET_LABLE_NAME\',$parent.$parent,item,UPDATELANGUAGECODEMODEL,\'UPDATELANGUAGECODEMODEL\')"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></div></div>'
                arrytemplate = arrytemplate.replace(/UPDATELANGUAGECODEMODEL/g, langModelStr)
                htm = langdivhtml + arrytemplate
            } else if (type == 'end') {
                var addLableText = $rootScope.label['add'] || "Add";
                htm = '</div><div class="col-md-12" ng-if="!ValuesReadOnly && ' + arrayNgModelLang + '.length > 0"><a ng-click="addLanguageItem(' + arrayNgModelLang + ',UPDATELANGUAGECODEMODEL,\'FILL_DATASET_LABLE_NAME\',MODULEID,\'FILL_DATASET_NAME\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>'
                if (loopModelCopy) {
                    htm = htm.replace(/UPDATELANGUAGECODEMODEL/g, loopModelCopy)
                }
                arrayNgModelLang = null;
                loopModelCopy = null;
            }
            return htm;
        }

        function getTemplate(type, loopModel) {
            var htm = '';
            if (type == "start") {
                arrayNgModelLang = angular.copy(loopModel);
                var langModel = loopModel.substr(loopModel.lastIndexOf('.') + 1);
                var langModelStr = langModel + 'langCode';
                loopModelCopy = angular.copy(langModelStr);
                var langdivhtml = '<div class=col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right"><div class="btn-group btn-group-xs"><span ng-if="ValuesReadOnly == false || ' + loopModel + '.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="UPDATELANGUAGECODEMODEL != label[\'add\']" ng-hide="UPDATELANGUAGECODEMODEL == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{UPDATELANGUAGECODEMODEL}}.png" class="langFlags">{{UPDATELANGUAGECODEMODEL || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in ' + loopModel + ' | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'UPDATELANGUAGECODEMODEL\',item.languageCode)"><img ng-hide="item.languageCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly"><a ng-click="deleteLanguage(item.languageCode,' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddLanguageCustom(' + loopModel + ',\'' + loopModel + '\',\'UPDATELANGUAGECODEMODEL\')">{{label["addLanguage"]}}</a></li></ul></span></div></div>'

                langdivhtml = langdivhtml + '<div style="padding: 0;" class="col-md-9" ng-if="(ValuesReadOnly == true && ' + loopModel + '.length == 0) || (' + loopModel + '.length == 0) || !' + loopModel + ' "><input class="form-control" type="text" disabled readonly ng-model="x"></div>'

                langdivhtml = langdivhtml.replace(/UPDATELANGUAGECODEMODEL/g, langModelStr)
                var arrytemplate = '<div class="row" style="margin-bottom:3%;padding: 0;"><div class="col-md-9" ng-repeat="item in ' + loopModel + '" ng-if="item.languageCode == ' + langModelStr + '"><input type="text" ng-class="{warningElementBorder: item.valueErr && !item.value}" class="form-control" type="text" ng-model="item.value" value="{{item.value}}"  ng-readonly="ValuesReadOnly">'
                arrytemplate = arrytemplate.replace(/UPDATELANGUAGECODEMODEL/g, langModelStr);
                htm = langdivhtml + arrytemplate;
            } else if (type == 'end') {
                var addLableText = $rootScope.label['add'] || "Add";
                htm = '</div><div class="col-md-12" ng-if="!ValuesReadOnly && ' + arrayNgModelLang + '.length > 0"></div></div>'
                if (loopModelCopy) {
                    htm = htm.replace(/UPDATELANGUAGECODEMODEL/g, loopModelCopy)
                }
                arrayNgModelLang = null;
                loopModelCopy = null;
            }
            return htm;
        }


        function renderPass2Html(formElem, parentType, aarOrObj, model, lable, optionsList) {
            //console.log('model == '+JSON.stringify(model))
            //console.log('lable == '+JSON.stringify(lable))
            //console.log('optionsList == '+JSON.stringify(optionsList))

            if (model.endsWith(".value") && !model.startsWith("item")) { //&& model.indexOf("item") == -1
                var indx = model.lastIndexOf('.');
                lable = model.substr(0, indx);
                //indx = lable.indexOf('.');
                indx = lable.lastIndexOf('.');
                lable = lable.substr(indx + 1);
            } else if (model.endsWith(".value") && model.startsWith("item")) { //&& model.indexOf("item") == -1
                var indx = model.lastIndexOf('.');
                lable = model.substr(0, indx);
                //indx = lable.indexOf('.');
                indx = lable.lastIndexOf('.');
                lable = lable.substr(indx + 1);
            }

            if (model.endsWith(".value.value") && model.indexOf("item") > -1) {
                lable = angular.copy(model);
                lable = lable.replace(".value.value", '');
                var indx = lable.lastIndexOf('.');
                lable = lable.substr(indx + 1)
                if (lable == 'item') {
                    lable = "Value";
                }
            }

            if (optionsList) {
                lable = angular.copy(model);
                lable = lable.replace(".value.value", '');
                if (lable.indexOf(".value") > -1) {
                    lable = lable.replace(".value", '');
                }
                var indx = lable.lastIndexOf('.');
                lable = lable.substr(indx + 1)
                if (lable.indexOf('item') > -1) {
                    lable = "Value";
                }
            }

            if (lable.indexOf('item') > -1) {
                lable = "Value";
            }

            var templateString = '';
            if (aarOrObj == "Array") {
                templateString = getPass2Template(aarOrObj + formElem.type, formElem, model, lable, optionsList, aarOrObj)
            } else {
                templateString = getPass2Template(formElem.type, formElem, model, lable, optionsList)
            }
            return templateString;
        }

        /*var availableListOfItemName = ["item1","item2","item3","item4","item5","item6","item7","item8",
        "item9","item10","item11","item12","item13""item14""item15""item16""item17""item1""item1""item1""item1""item1""item1"
        "item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1""item1"
        "item1"]*/
        var itemNO = 0;

        function pass2UIGenerator(schemaNode, parentType, model) {
            var formElems;
            var aarOrObj;
            var retHTML = "";
            if (!model || model == "") {
                model = moduleId
            }
            if (schemaNode.type == 'object') {
                formElems = schemaNode.properties;
                aarOrObj = "Object";
            } else if (schemaNode.type == 'array') {
                formElems = schemaNode.items.properties;
                aarOrObj = "Array";
            } else {
                formElems = schemaNode;
            }

            if (formElems) {
                var formElemsKeys = Object.keys(formElems);

                for (var i = 0; i < formElemsKeys.length; i++) {
                    if (formElemsKeys[i] != "avpList") {
                        formElem = formElems[formElemsKeys[i]];
                        var loopModel = model + "." + formElemsKeys[i];
                        // Fix for handling 'oneOf' type in json schema : Jan 12 2017
                        if (formElem.oneOf) {
                            formElem = formElem.oneOf[0];
                        }
                        // Fix end for handling 'oneOf' type in json schema : Jan 12 2017
                        if (formElem.type && (formElem.type == "array" || formElem.type == "object")) {
                            if (formElem.type == "array") {
                                var textLable = angular.copy(formElemsKeys[i])
                                var parsedLabel = textLable.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                                    return str.toUpperCase();
                                });
                                if (formElem.items && formElem.items.properties && formElem.items.properties.languageCode && Object.keys(formElem.items.properties).length == 3 && Object.keys(formElem.items.properties).indexOf("value") > -1 && Object.keys(formElem.items.properties).indexOf("codeListVersion") > -1) {
                                    // Handling array with language data
                                    if (formElem.type1LanguageUI) {
                                        retHTML += '<div class="col-md-9" style="padding: 0;"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">' + parsedLabel + '</label></div>'
                                        /*<span "(ValuesReadOnly == true && ' + loopModel + '.length == 0) || (' + loopModel + '.length == 0)" class="ng-scope">'+
                                                                                 '<input class="form-control input-sm" placeholder="" type="text" maxlength="80" readonly=""></span>*/

                                        retHTML += getTemplate('start', loopModel);
                                        retHTML += getTemplate('end', loopModel)
                                    } else {
                                        retHTML += '<div class="col-md-12" style="padding: 0;"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">' + parsedLabel + '</label></div>'
                                        retHTML += getPass2TemplateForLanguageCode('start', loopModel);
                                        loopModel = "item" + itemNO;
                                        retHTML += pass2UIGenerator(formElem, aarOrObj, loopModel);
                                        retHTML += getPass2TemplateForLanguageCode('end', loopModel)
                                    }


                                } else {
                                    // Handling other types of array
                                    var keyValueName = formElemsKeys[i];
                                    var newLoopModelItem = "item" + itemNO;
                                    /*var pLabel = textLable.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                                    return str.toUpperCase();
                                    });*/
                                    var arrNam = '<div class="row"><div class="col-md-12"><label class="control-label">' + parsedLabel + '</label></div></div>';
                                    //var ht = arrNam + '<div ng-repeat="item in LOOPNGMODEL" style="border: solid 1px;border-color: #e7eaec;padding: 3%;margin-bottom: 2%;"><div class="col-md-offset-8 col-md-2 pull-right" style="text-align: right" ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,LOOPNGMODEL,$parent.$parent.item,\'' + keyValueName + '\',$parent.$parent,item)"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></div>';
                                    var ht = arrNam + '<div ng-repeat="' + newLoopModelItem + ' in LOOPNGMODEL" style="border: solid 1px;border-color: #e7eaec;padding: 3%;margin-bottom: 2%;"><div class="col-lg-2 col-md-2 col-sm-2 pull-right HIDEAVPLISTSYMBOL" style="padding: 0;"><a ng-click="showCustomAVPModal(' + newLoopModelItem + '.avpList.stringAVP,\'' + newLoopModelItem + '.avpList.stringAVP\',\'stringAVP\',' + newLoopModelItem + ')"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning">{{' + newLoopModelItem + '.avpList.stringAVP.length || 0}}</span></a></div><div class="col-md-offset-8 col-md-2 pull-right" style="text-align: right" ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,LOOPNGMODEL,$parent.$parent.item,\'' + keyValueName + '\',$parent.$parent,' + newLoopModelItem + ')"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></div>'

                                    if (Object.keys(formElem.items.properties).indexOf("avpList") > -1) {
                                        ht = ht.replace('HIDEAVPLISTSYMBOL', '');
                                    }
                                    ht = ht.replace(/LOOPNGMODEL/g, loopModel);
                                    var cpLoopModel = angular.copy(loopModel);
                                    retHTML += ht;
                                    //retHTML += '<div ng-repeat="item in ' + loopModel + '">';
                                    loopModel = "item" + itemNO;
                                    itemNO = itemNO + 1;
                                    retHTML += pass2UIGenerator(formElem, aarOrObj, loopModel);
                                    var bindx = cpLoopModel.indexOf('.');
                                    var backtrackItemName = cpLoopModel.substr(0, bindx);

                                    ht = '</div><div class="row" ng-if="!ValuesReadOnly"><div class="col-md-12" style="margin-top:1%"><a ng-click="addItem(LOOPNGMODEL,' + backtrackItemName + ',\'' + keyValueName + '\',MODULEID,\'LOOPNGMODEL\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>';
                                    ht = ht.replace(/LOOPNGMODEL/g, cpLoopModel);
                                    retHTML += ht;
                                    //retHTML += '</div>';
                                }
                            } else {
                                retHTML += '<div type:"' + formElem.type + '">';
                                retHTML += pass2UIGenerator(formElem, aarOrObj, loopModel);
                                retHTML += '</div>';
                            }

                        } else if (formElem.type) {

                            // RENDER HERE
                            // Do not render language html element
                            //if (formElemsKeys[i] != 'languageCode') {
                            retHTML += renderPass2Html(formElem, parentType, aarOrObj, loopModel, formElemsKeys[i]);
                            //}
                        }
                    }
                }
                return (retHTML);
            }
        }

        var pass1HtmlTemplates = {
            "UISingleColWithAVP": '<div class="row" style="min-height: 150px;"><div class="col-lg-3 col-md-3 col-sm-3 pull-right" style="text-align: right;margin-right:5%;margin-top: -3%;"><a ng-click="showCustomAVPModal()"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning ng-binding">0</span></a></div><div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">',
            "UISingleColWithoutAVP": '<div><div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">',
            "UISingleColEnd": '</div></div></div>',
            //"UIMultiColWithAVP": '<div class="row" style="min-height: 150px;"><div class="col-lg-3 col-md-3 col-sm-3 pull-right" style="text-align: right;margin-right:5%;margin-top: -3%;"><a ng-click="showCustomAVPModal()"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning ng-binding">0</span></a></div><div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6" style="padding-left:0;">',
            "UIMultiColWithAVP": '<div class="row" style="min-height: 150px;"><div class="col-lg-3 col-md-3 col-sm-3 pull-right" style="text-align: right;margin-right:-1%;margin-top: -3%;"><a ng-click="showCustomAVPModal(AVPNGMODEL,\'AVPNGMODEL\')"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning">{{AVPNGMODEL.length || 0}}</span></a></div><div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6" style="padding-left:0;">',
            "UIMultiColWithoutAVP": '<div><div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6">',
            "UIMultiColIntermediate": '</div><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6" style="padding-right:0;">',
            "UIMultiColEnd": '</div></div></div></div>',
            "boxstart": '<div class="ibox float-e-margins"><div class="ibox-title"<lable class="IS_REQUIRED_FIELD_ELEMENT"><h5>BOX_TITLE_TEXT</h5></lable><div class="ibox-tools"><a class="collapse-link" ng-click="slider($event)"><i class="fa fa-chevron-up"></i></a></div></div><div class="ibox-content">',
            "boxend": '</div></div>',
            "anyType": '<div id="anyTypeDataDiv"></div>',
            "imageLinkBox": '<div class="ibox float-e-margins"><div class="ibox-title"<lable class="IS_REQUIRED_FIELD_ELEMENT"><h5>BOX_TITLE_TEXT</h5></lable><div class="ibox-tools"><a class="deleteImages" ng-click="openConfirmImageDeleteModal()" ng-if="imagesMarkedForDeleteArr && imagesMarkedForDeleteArr.length > 0"> <i class="fa fa-lg fa-trash text-danger"></i></a><a class="collapse-link" ng-click="slider($event)"><i class="fa fa-chevron-up"></i></a></div></div><div class="ibox-content">',
            //"imageLink": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-ex-12 text-right" ng-if="BASENGMODEL.imageLanguage"><div class="btn-group btn-group-xs"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-src="{{imageUrlPrefix}}/flags/{{BASENGMODEL.imageLanguage}}.png" class="langFlags"> {{BASENGMODEL.imageLanguage}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in BASENGMODEL.imageLangArray track by $index" class="padding-20"><div class="langLeft"><a ng-click="BASENGMODEL.imageLanguage = item;" ng-model="langCode"><img ng-src="{{imageUrlPrefix}}/flags/{{item}}.png" class="langFlags">{{item}}</a></div></li><li class="padding-10"></li></ul></div></div></div><div class="row"><div class="col-md-4" ng-if="BASENGMODEL.imageLink.length > 0 && (arrayObjectIndexOf(image.languageCode,BASENGMODEL.imageLanguage,\'value\') > -1)" ng-repeat="image in BASENGMODEL.imageLink"><div class="row"><div class="col-md-12 text-right"><input type="checkbox" ng-checked="image.imageMarkedForDelete == true" ng-click="markExistingImageForDelete(image,image.url,image.languageCode.value,$index)" ng-if="ValuesReadOnly == false" style="margin-right:5%"><a class="hideAvpList" ng-click="showCustomAVPModal(image.avpList.stringAVP,null,\'stringAVP\')"><i class="fa fa-list-ul"></i><span class="badge badge-warning">{{image.avpList.stringAVP.length}}</span></a></div></div><div class="row"><div class="col-md-12"><div class="thumbnail"><img ng-src="{{image.updatedUrl}}" err-src="{{imageUrlPrefix}}/image_broken_links_thumbnail.png" class="white-bg img-responsive margin-bottom grey-border display-inline-block" data-toggle="tooltip" data-placement="bottom" title="Code&nbsp;&nbsp;&nbsp;{{image.imageTypeCode.type}}&#10;HEIGHT&nbsp;&nbsp;&nbsp;{{image.imagePixelHeight.value}}px&#10;WIDTH&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{image.imagePixelWidth.value}}px&#10;FILESIZE&nbsp;&nbsp;{{image.fileSize.value}}{{image.fileSize.measurementUnitCode}}"></div></div></div></div></div><div class="row"><div class="col-md-3 text-right" ng-if="ValuesReadOnly ==false"><a ng-click="disableSaveBtn = true;" data-toggle="modal" data-target="#customModuleImageModal" data-backdrop="static" data-keyboard="false"><img ng-src="{{imageUrlPrefix}}/AddImage.png" class="img-responsive addProductImg"></a></div></div>',
            "imageLink": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-ex-12 text-right" ng-if="BASENGMODEL.imageLanguage"><div class="btn-group btn-group-xs"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-src="{{imageUrlPrefix}}/flags/{{BASENGMODEL.imageLanguage}}.png"  ng-hide="BASENGMODEL.imageLanguage == label[\'universal\']" class="langFlags"> {{BASENGMODEL.imageLanguage}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in BASENGMODEL.imageLangArray track by $index" class="padding-20"><div class="langLeft"><a ng-click="BASENGMODEL.imageLanguage = item;" ng-model="langCode"><img ng-src="{{imageUrlPrefix}}/flags/{{item}}.png" ng-hide="item == label[\'universal\']" class="langFlags">{{item}}</a></div></li><li class="padding-10"></li></ul></div></div></div><div class="row"><div class="col-md-4" ng-if="BASENGMODEL.imageLink.length > 0 && (arrayObjectIndexOf(image.languageCode,BASENGMODEL.imageLanguage,\'value\') > -1)" ng-repeat="image in BASENGMODEL.imageLink"><div class="row"><div class="col-md-12 text-right"><input type="checkbox" ng-checked="image.imageMarkedForDelete == true" ng-click="markExistingImageForDelete(image,image.url,image.languageCode.value,$index)" ng-if="ValuesReadOnly == false" style="margin-right:5%"><a class="hideAvpList" ng-click="showCustomAVPModal(image.avpList.stringAVP,null,\'stringAVP\')"><i class="fa fa-list-ul"></i><span class="badge badge-warning">{{image.avpList.stringAVP.length}}</span></a></div></div><div class="row"><div class="col-md-12"><div class="thumbnail"><img ng-src="{{image.updatedUrl}}" err-src="{{imageUrlPrefix}}/image_broken_links_thumbnail.png" class="white-bg img-responsive margin-bottom grey-border display-inline-block" data-toggle="tooltip" data-placement="bottom" title="Code&nbsp;&nbsp;&nbsp;{{image.imageTypeCode.type}}&#10;HEIGHT&nbsp;&nbsp;&nbsp;{{image.imagePixelHeight.value}}px&#10;WIDTH&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{image.imagePixelWidth.value}}px&#10;FILESIZE&nbsp;&nbsp;{{image.fileSize.value}}{{image.fileSize.measurementUnitCode}}"></div></div></div></div></div><div class="row"><div class="col-md-3 text-right" ng-if="ValuesReadOnly ==false"><a ng-click="disableSaveBtn = true;" data-toggle="modal" data-target="#customModuleImageModal" data-backdrop="static" data-keyboard="false"><img ng-src="{{imageUrlPrefix}}/AddImage.png" class="img-responsive addProductImg"></a></div></div>',
            "measurementUnit": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12" style="padding:0"><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6"><div class="form-group"><label class="control-label">DISPLAY_LABEL</label><input valid-number class="form-control" type="text" ng-model="BASENGMODEL.MODELKEY.value" ng-readonly="ValuesReadOnly"></div></div><div class="col-lg-6 col-md-6 col-sm-6 col-xs-6"><div class="form-group"><label class="control-label">{{label["MeasurementUnit"]}}</label><select class="form-control" ng-model="BASENGMODEL.MODELKEY.measurementUnitCode" ng-options="unit.value as (unit.name + \' ( \'+ unit.value + \' )\' ) for unit in measurementUnits | orderBy:\'name\'" ng-disabled="ValuesReadOnly"><option value="" disabled>{{label["select measurement unit"]}}</option></select></div></div></div></div>',
            "string": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="form-group"><label class="control-label">DISPLAY_LABEL</label><input class="form-control" type="text" ng-model="BASENGMODEL.MODELKEY" ng-readonly="ValuesReadOnly"/></div></div></div>',
            "integer": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="form-group"><label class="control-label">DISPLAY_LABEL</label><input valid-number class="form-control" type="text" ng-model="BASENGMODEL.MODELKEY" ng-readonly="ValuesReadOnly"/></div></div></div>',
            "number": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="form-group"><label class="control-label">DISPLAY_LABEL</label><input valid-number class="form-control" type="text" ng-model="BASENGMODEL.MODELKEY" ng-readonly="ValuesReadOnly"/></div></div></div>',
            "boolean": '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div class="form-group"><label class="control-label">DISPLAY_LABEL</label><input class="" type="checkbox" style="margin-left: 3%;" ng-model="BASENGMODEL.MODELKEY" ng-disabled="ValuesReadOnly"/></div></div></div>',
            "array": '<div></div>',
            "object": '<div></div>',
            //"productAttributesList": '<div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Canonical Name</label></div><div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Value</label></div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right"><div class="btn-group btn-group-xs"><span ng-if="(ValuesReadOnly == true && BASENGMODEL.productAttributesList.productAttributes.length == 0 )|| (ValuesReadOnly == true && !BASENGMODEL.productAttributesList.productAttributes)">{{label[\'add\']}}</span><span ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="productAttributeslangCode != label[\'add\']" ng-src="{{imageUrlPrefix}}/flags/{{productAttributeslangCode}}.png" class="langFlags">{{productAttributeslangCode || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'productAttributeslangCode\',item.languageCode)"><img ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly"><a ng-click="deleteLanguage(item.languageCode,BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddLanguageCustom(BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')">{{label["addLanguage"]}}</a></li></ul></span></div></div><div class="row"><div class="col-md-12" ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes" ng-if="item.languageCode == productAttributeslangCode" style="margin-bottom: 10px;"><div class="row"><div class="col-md-12"><div class="form-group"><div class="col-md-5"><input class="form-control  ng-pristine ng-valid ng-valid-minlength ng-valid-maxlength ng-touched" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.canonicalName" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.canonicalName}" readonly="readonly"></div><div class="col-md-5"><input class="form-control  ng-pristine ng-untouched ng-valid ng-valid-minlength ng-valid-maxlength" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.value" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.value}" readonly="readonly"></div><div class="col-md-2"><span ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,BASENGMODEL.productAttributesList.productAttributes,$parent.$parent.item,\'FILL_DATASET_LABLE_NAME\',$parent.$parent,item,productAttributeslangCode,\'productAttributeslangCode\')"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></span></div></div></div></div></div><div class="col-md-12" ng-if="!ValuesReadOnly && BASENGMODEL.productAttributesList.productAttributes.length > 0"><a ng-click="addLanguageItem(BASENGMODEL.productAttributesList.productAttributes,productAttributeslangCode,\'FILL_DATASET_LABLE_NAME\',MODULEID,\'FILL_DATASET_NAME\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>'
            //"productAttributesList": '<div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Canonical Name</label></div><div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Value</label></div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right" style="padding:0;"><div class="btn-group btn-group-xs"><span ng-if="(ValuesReadOnly == true && BASENGMODEL.productAttributesList.productAttributes.length == 0 )|| (ValuesReadOnly == true && !BASENGMODEL.productAttributesList.productAttributes)">{{label[\'add\']}}</span><span ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="productAttributeslangCode != label[\'add\']" ng-hide="productAttributeslangCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{productAttributeslangCode}}.png" class="langFlags">{{productAttributeslangCode || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'productAttributeslangCode\',item.languageCode)"><img ng-hide="item.languageCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly" ng-hide="item.languageCode == label[\'universal\']"><a ng-click="deleteLanguage(item.languageCode,BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddLanguageCustom(BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')">{{label["addLanguage"]}}</a></li></ul></span></div></div><div class="row"><div class="col-md-12" ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes" ng-if="item.languageCode == productAttributeslangCode" style="margin-bottom: 10px;"><div class="row"><div class="col-md-12"><div class="form-group"><div class="col-md-5"><input class="form-control  ng-pristine ng-valid ng-valid-minlength ng-valid-maxlength ng-touched" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.canonicalName" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.canonicalName}" readonly="readonly"></div><div class="col-md-5"><input class="form-control  ng-pristine ng-untouched ng-valid ng-valid-minlength ng-valid-maxlength" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.value" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.value}" readonly="readonly"></div><div class="col-md-2"><span ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,BASENGMODEL.productAttributesList.productAttributes,$parent.$parent.item,\'FILL_DATASET_LABLE_NAME\',$parent.$parent,item,productAttributeslangCode,\'productAttributeslangCode\')"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></span></div></div></div></div></div><div class="col-md-12" ng-if="!ValuesReadOnly && BASENGMODEL.productAttributesList.productAttributes.length > 0"><a ng-click="addLanguageItem(BASENGMODEL.productAttributesList.productAttributes,productAttributeslangCode,\'FILL_DATASET_LABLE_NAME\',MODULEID,\'FILL_DATASET_NAME\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>'
            "productAttributesList": '<div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Canonical Name</label></div><div class="col-lg-5 col-md-5 col-sm-5 col-xs-5" ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><label class="control-label IS_REQUIRED_FIELD" style="padding: 6px 5px;">Value</label></div><div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 pull-right" style="padding:0;"><div class="btn-group btn-group-xs"><span ng-if="(ValuesReadOnly == true && BASENGMODEL.productAttributesList.productAttributes.length == 0 )|| (ValuesReadOnly == true && !BASENGMODEL.productAttributesList.productAttributes)">{{label[\'add\']}}</span><span ng-if="ValuesReadOnly == false || BASENGMODEL.productAttributesList.productAttributes.length > 0"><a class="btn btn-link dropdown-toggle" data-toggle="dropdown"><img ng-if="productAttributeslangCode != label[\'add\']" ng-hide="productAttributeslangCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{productAttributeslangCode}}.png" class="langFlags">{{productAttributeslangCode || label["add"]}}<span class="fa fa-caret-down"></span></a><ul class="dropdown-menu langDropDown" role="menu"><li ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes | unique:\'languageCode\' " class="padding-20"><div class="langLeft"><a value="{{item.languageCode}}" ng-click="changeLanguage(\'productAttributeslangCode\',item.languageCode)"><img ng-hide="item.languageCode == label[\'universal\']" ng-src="{{imageUrlPrefix}}/flags/{{item.languageCode}}.png" class="langFlags">{{item.languageCode}}</a></div><div class="langRight" ng-if="!ValuesReadOnly" ng-hide="item.languageCode == label[\'universal\']"><a ng-click="deleteLanguage(item.languageCode,BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')" ng-if="ValuesReadOnly == false"><i class="-square-o fa fa-lg fa-times-circle text-danger"></i></a></div></li><li ng-if="ValuesReadOnly" class="padding-10"></li><li ng-if="ValuesReadOnly == false"><a ng-click="AddUniveralLanguageCustom(BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')" ng-if="isAddUniversalVisible == true">{{label[\'addUniversal\']}}</a><a ng-click="AddLanguageCustom(BASENGMODEL.productAttributesList.productAttributes,\'BASENGMODEL.productAttributesList.productAttributes\',\'productAttributeslangCode\')">{{label["addLanguage"]}}</a></li></ul></span></div></div><div class="row"><div class="col-md-12" ng-repeat="item in BASENGMODEL.productAttributesList.productAttributes" ng-if="item.languageCode == productAttributeslangCode" style="margin-bottom: 10px;"><div class="row"><div class="col-md-12"><div class="form-group"><div class="col-md-5"><input class="form-control  ng-pristine ng-valid ng-valid-minlength ng-valid-maxlength ng-touched" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.canonicalName" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.canonicalName}" readonly="readonly"></div><div class="col-md-5"><input class="form-control  ng-pristine ng-untouched ng-valid ng-valid-minlength ng-valid-maxlength" type="text" maxlength="REPLACE_MAXLENGTH" minlength="REPLACE_MINLENGTH" ng-readonly="ValuesReadOnly" ng-model="item.value" ng-class="{errElementBorder: MODEL_ERR_FLAG &amp;&amp; !item.value}" readonly="readonly"></div><div class="col-md-2"><span ng-if="!ValuesReadOnly"><a ng-click="deleteItem($index,BASENGMODEL.productAttributesList.productAttributes,$parent.$parent.item,\'FILL_DATASET_LABLE_NAME\',$parent.$parent,item,productAttributeslangCode,\'productAttributeslangCode\')"><i class="-square-o fa fa-2x fa-fw fa-minus-square-o text-danger"></i></a></span></div></div></div></div></div><div class="col-md-12" ng-if="!ValuesReadOnly && BASENGMODEL.productAttributesList.productAttributes.length > 0"><a ng-click="addLanguageItem(BASENGMODEL.productAttributesList.productAttributes,productAttributeslangCode,\'FILL_DATASET_LABLE_NAME\',MODULEID,\'FILL_DATASET_NAME\')"><i class="fa fa-2x fa-fw fa-plus-square-o text-info"></i></a></div></div>'
        }

        var getPass1Template = function (type, displayName, model) {
            var template = pass1HtmlTemplates[type];
            if (displayName) {
                displayName = displayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                    return str.toUpperCase();
                });
                template = template.replace("DISPLAY_LABEL", displayName)
            }
            if (moduleId) {
                template = template.replace(/BASENGMODEL/g, moduleId)
            }
            if (model) {
                template = template.replace(/MODELKEY/g, model);
            }
            return template;
        }

        var pass1UIGenerator = function (JSchema) {
            var title = '';
            var keyArray = Object.keys(JSchema.properties);
            if (keyArray.indexOf("avpList") > -1) {
                return {
                    "html": "AVP",
                    "title": title
                };
            } else if (keyArray.indexOf("imageLink") > -1) {
                var htm = getPass1Template("imageLink");
                return {
                    "html": htm,
                    "title": "Product Images"
                };
            } else if (keyArray.indexOf("linkInfoCode") > -1) {
                // return pre build HTML template code
                return {
                    "html": "link info code",
                    "title": "XXX"
                };
            } else if (keyArray.indexOf("productInformationLink") > -1) {
                return {
                    "html": "",
                    "title": "Product Information Links"
                };
            } else {
                var htm = '';
                for (var i = 0; i < keyArray.length; i++) {
                    if (JSchema.properties[keyArray[i]].uiStyle && JSchema.properties[keyArray[i]].uiStyle == "measurementUnit") {
                        htm += getPass1Template("measurementUnit", keyArray[i], keyArray[i]);
                    } else if (keyArray[i] == "productAttributesList") {
                        //alert("ssss");
                        var htmlOfProductAttr = getPass1Template("productAttributesList", "Product Attribute List", moduleId);
                        return {
                            "html": htmlOfProductAttr,
                            "title": "Product Attribute List"
                        };
                        //htm += getPass1Template("productAttributesList");
                    } else if (JSchema.properties[keyArray[i]].uiStyle && JSchema.properties[keyArray[i]].uiStyle == "complex") {
                        // call pass2UIGenerator to process complex json schema
                        var htm = pass2UIGenerator(JSchema);

                        return {
                            "html": htm,
                            "title": JSchema.properties[keyArray[i]].boxDisplayName
                        }
                    } else if (Object.keys(JSchema.properties[keyArray[i]]).length == 0) {
                        // NO NEED TO HANDLE ANY TYPE IN THIS FACTORY, THIS WILL BE HANDLED BY OTHER FACTORY MODULE OF THIS LIBRARY
                        //htm = getPass1Template("anyType");
                        htm = "";
                    } else {
                        htm += getPass1Template(JSchema.properties[keyArray[i]].type, keyArray[i], keyArray[i]);
                    }
                }
                return {
                    "html": htm,
                    "title": title
                };
            }
        }

        var generateUI = function (JSONSchemaArry, htmlStr, cb) {
            var singleBoxSchema = JSONSchemaArry.pop();

            var keyArray = Object.keys(singleBoxSchema.properties);
            if (keyArray.indexOf("imageLink") > -1) {
                htmlStr = htmlStr + getPass1Template("imageLinkBox");
            } else {
                htmlStr = htmlStr + getPass1Template("boxstart");
            }
            //console.log('singleBoxSchema ================' + JSON.stringify(singleBoxSchema));
            var responceObj = pass1UIGenerator(singleBoxSchema);
            //console.log('responceObj == ' + JSON.stringify(responceObj))
            /*  if (responceObj.title && responceObj.title != 'Item') {
                  //htmlStr = htmlStr.replace("BOX_TITLE_TEXT", responceObj.title)
              } else {
                  htmlStr = htmlStr.replace("BOX_TITLE_TEXT", "")
              }*/
            htmlStr = htmlStr.replace("BOX_TITLE_TEXT", "");


            htmlStr = htmlStr + responceObj.html

            htmlStr = htmlStr + getPass1Template("boxend");
            if (JSONSchemaArry.length == 0) {
                //console.log('htmlStr === return =========== ')

                if (cb) {
                    cb(htmlStr)
                } else {
                    return htmlStr;
                }
            } else {
                //console.log('htmlStr ===  passss =========')
                generateUI(JSONSchemaArry, htmlStr, cb);
            }
        };

        return {
            getHTML: function (moduleObject) {
                return $q(function (resolve, reject) {

                    var JSchema = angular.copy(moduleObject.dereferencedSchema);
                    if (!JSchema)
                        reject(__errMsgObj['r02']);

                    if (typeof JSchema != "object")
                        reject(__errMsgObj['r02']);

                    try {
                        var testJsonObj = JSON.parse(JSON.stringify(JSchema))
                    } catch (e) {
                        __errMsgObj['r03'].errDetails = e;
                        reject(__errMsgObj['r03']);
                    }

                    if (!$.isArray(JSchema)) {

                        if (moduleObject._id) {
                            moduleId = "cust" + moduleObject._id;
                        } else {
                            moduleId = moduleObject.ngmodel;
                        }

                        var analysePromice = analyseRequiredBoxesCSS(JSchema);
                        analysePromice.then(function (responce) {
                            var res = responce.data;
                            var isAVPPresent = responce.avpFlag
                            var isAnyTypePresent = responce.isAnyTypePresent
                            var partitionIndex = 0;
                            var part1Data = [];
                            var part2Data = [];
                            //console.log('analyzer responce == ' + JSON.stringify(res));
                            if (res.length > 1) {
                                partitionIndex = Math.round(res.length / 2);
                                res.forEach(function (element, index) {
                                    if (index >= partitionIndex) {
                                        part2Data.push(angular.copy(element))
                                    } else {
                                        part1Data.push(angular.copy(element))
                                    }
                                });
                                //console.log('part1Data == ' + JSON.stringify(part1Data));
                                //console.log('part2Data == ' + JSON.stringify(part2Data));
                            }
                            //console.log('partitionIndex === ' + partitionIndex);

                            var html = '';

                            if (partitionIndex) {
                                if (isAVPPresent) {
                                    //console.log('in part avp')
                                    html = getPass1Template("UIMultiColWithAVP");
                                    html = html.replace(/AVPNGMODEL/g, moduleId + '.avpList.stringAVP')
                                } else {
                                    //console.log('in part avp else')
                                    html = getPass1Template("UIMultiColWithoutAVP");
                                }

                                html = generateUI(part2Data, html, function (htmls) {
                                    html = htmls + getPass1Template("UIMultiColIntermediate");
                                    generateUI(part1Data, html, function (htmld) {
                                        html = htmld + getPass1Template("UIMultiColEnd");
                                        if (isAnyTypePresent) {
                                            html = html + '<div class="row" id="anyTypeDataDiv"></div>';
                                        }
                                        resolve(html);
                                    });

                                });

                            } else {
                                //console.log('in without part');
                                //console.log('res === ' + JSON.stringify(res));
                                //[{"type":"object","properties":{"item":{}}}]
                                if (res[0].properties && res[0].properties.item && isAnyTypePresent) {
                                    if (isAVPPresent) {
                                        html = html + '<div class="row"><div class="col-lg-3 col-md-3 col-sm-3 pull-right" style="text-align: right;margin-right:5%;margin-top: -3%;"><a ng-click="showCustomAVPModal(AVPNGMODEL,\'AVPNGMODEL\')"><i class="fa fa-2x fa-list-ul"></i><span class="badge badge-warning">{{AVPNGMODEL.length || 0}}</span></a></div></div>'
                                        html = html.replace(/AVPNGMODEL/g, moduleId + '.avpList.stringAVP')
                                        html = html + '<div class="row" id="anyTypeDataDiv"></div>';
                                    } else {
                                        html = html + '<div class="row" id="anyTypeDataDiv"></div>';
                                    }

                                } else {
                                    if (isAVPPresent) {
                                        html = getPass1Template("UIMultiColWithAVP");
                                        html = html.replace(/AVPNGMODEL/g, moduleId + '.avpList.stringAVP')
                                    } else {
                                        html = getPass1Template("UIMultiColWithoutAVP");
                                    }
                                    html = generateUI(res, html);
                                    html = html + getPass1Template("UIMultiColIntermediate");
                                    html = html + getPass1Template("UIMultiColEnd");
                                    /* if (isAVPPresent) {
                                         html = getPass1Template("UISingleColWithAVP");
                                     } else {
                                         html = getPass1Template("UISingleColWithoutAVP");
                                     }
                                     html = generateUI(res, html);
                                     html = html + getPass1Template("UISingleColEnd");*/
                                }
                                resolve(html);
                            }

                        }, function (err) {
                            // this block not need to return or execute.
                        });
                    } else {
                        reject(__errMsgObj['r02']);
                    }
                });
            }
        };

    }]).factory('BuildUIFromDATA', ['$q', '$rootScope', function ($q, $rootScope) {

        var getObjectSchema = function (Jobject) {

            if ($.isArray(Jobject)) {
                var schemaNode = getArraySchema(Jobject);
                return schemaNode;
            } else {
                var arrElementObjSchema = {
                    "type": "object",
                    "properties": {},
                    "required": []
                };
                var keyArr = Object.keys(Jobject);
                for (var i = 0; i < keyArr.length; i++) {
                    if ($.isArray(Jobject[keyArr[i]])) {
                        var schemaNode = getArraySchema(Jobject[keyArr[i]]);
                        if (!arrElementObjSchema.properties[keyArr[i]]) {
                            arrElementObjSchema.properties[keyArr[i]] = schemaNode;
                        } else {
                            $.extend(true, arrElementObjSchema.properties[keyArr[i]], arrElementObjSchema.properties[keyArr[i]], schemaNode);
                        }
                    } else if (typeof Jobject[keyArr[i]] == "object") {
                        var schemaNodes = getObjectSchema(Jobject[keyArr[i]]);
                        if (!arrElementObjSchema.properties[keyArr[i]]) {
                            arrElementObjSchema.properties[keyArr[i]] = schemaNodes;
                        } else {
                            $.extend(true, arrElementObjSchema.properties[keyArr[i]], arrElementObjSchema.properties[keyArr[i]], schemaNodes);
                        }
                    } else {
                        if (!arrElementObjSchema.properties[keyArr[i]]) {
                            arrElementObjSchema.properties[keyArr[i]] = {
                                "type": typeof Jobject[keyArr[i]]
                            };
                        } else {
                            $.extend(true, arrElementObjSchema.properties[keyArr[i]], arrElementObjSchema.properties[keyArr[i]], {
                                "type": typeof Jobject[keyArr[i]]
                            });
                        }
                        if (Jobject[keyArr[i]]) {
                            arrElementObjSchema.required.push(keyArr[i]);
                        }
                    }
                }
                return arrElementObjSchema
            }

        }

        var getArraySchema = function (arr) {

            var arrElementObjSchema = {
                "type": "array",
                "items": {
                    "properties": {}
                },
                "required": []
            };
            var requiredFieldObj = {};
            var keyArr = [];

            for (var x = 0; x < arr.length; x++) {
                var keys = Object.keys(arr[x]);
                for (var y = 0; y < keys.length; y++) {
                    if (keyArr.indexOf(keys[y]) == -1) {
                        keyArr.push(keys[y]);
                    }
                }
            }

            for (var i = 0; i < arr.length; i++) {
                for (var j = 0; j < keyArr.length; j++) {
                    if (arr[i][keyArr[j]] || arr[i][keyArr[j]] == '') {
                        if ($.isArray(arr[i][keyArr[j]])) { //array datatype
                            var tempArr = [];
                            for (var k = 0; k < arr.length; k++) {
                                if (arr[k][keyArr[j]]) {
                                    arr[k][keyArr[j]].forEach(function (elem, index) {
                                        tempArr.push(elem);
                                    });
                                }
                            }
                            var tempObj = {};
                            $.each(tempArr, function (i, o) {
                                $.extend(tempObj, o);
                            });
                            var schemaNode = getArraySchema([tempObj]);
                            if (!arrElementObjSchema.items.properties[keyArr[j]]) {
                                arrElementObjSchema.items.properties[keyArr[j]] = schemaNode;
                            } else {
                                $.extend(true, arrElementObjSchema.items.properties[keyArr[j]], arrElementObjSchema.items.properties[keyArr[j]], schemaNode);
                            }
                        } else if (typeof arr[i][keyArr[j]] == "object") { //object datatype
                            var schemaNodes = getObjectSchema(arr[i][keyArr[j]]);
                            if (!arrElementObjSchema.items.properties[keyArr[j]]) {
                                arrElementObjSchema.items.properties[keyArr[j]] = schemaNodes;
                            } else {
                                $.extend(true, arrElementObjSchema.items.properties[keyArr[j]], arrElementObjSchema.items.properties[keyArr[j]], schemaNodes);
                            }
                        } else { //simple datatype
                            if (!arrElementObjSchema.items.properties[keyArr[j]]) {
                                arrElementObjSchema.items.properties[keyArr[j]] = {
                                    "type": typeof arr[i][keyArr[j]]
                                };
                            } else {
                                $.extend(true, arrElementObjSchema.items.properties[keyArr[j]], arrElementObjSchema.items.properties[keyArr[j]], {
                                    "type": typeof arr[i][keyArr[j]]
                                });
                            }
                            // Bellow code to set required property in array item element
                            if (!requiredFieldObj[keyArr[j]] && arr[i][keyArr[j]]) {
                                requiredFieldObj[keyArr[j]] = true;
                            }
                            if (!arr[i][keyArr[j]] && requiredFieldObj[keyArr[j]]) {
                                requiredFieldObj[keyArr[j]] = false;
                            }
                            if (arr[i][keyArr[j]] == "") {
                                if (requiredFieldObj[keyArr[j]]) {
                                    requiredFieldObj[keyArr[j]] = false;
                                }
                            }
                        }
                    }
                }
            }

            for (var key in requiredFieldObj) {
                if (requiredFieldObj.hasOwnProperty(key)) {
                    if (requiredFieldObj[key]) {
                        arrElementObjSchema.required.push(key);
                    }
                }
            }

            return arrElementObjSchema;
        }

        var parseJsonObject = function (jsonObject, cb) {

            var schema = {
                "type": "object",
                "properties": {},
                "required": []
            }
            var keyArray = Object.keys(jsonObject.data);
            for (var i = 0; i < keyArray.length; i++) {
                if ($.isArray(jsonObject.data[keyArray[i]])) {
                    var JSchemaArrayNode = getArraySchema(jsonObject.data[keyArray[i]]);
                    schema.properties[keyArray[i]] = JSchemaArrayNode
                } else if (typeof (jsonObject.data[keyArray[i]]) == "object") {
                    var JSchemaObjectNode = getObjectSchema(jsonObject.data[keyArray[i]]);
                    schema.properties[keyArray[i]] = JSchemaObjectNode
                } else {
                    schema.properties[keyArray[i]] = {
                        "type": typeof jsonObject.data[keyArray[i]]
                    }
                }
            }
            cb(schema);
        }

        return {
            generateSchema: function (jsonObject) {
                return $q(function (resolve, reject) {
                    parseJsonObject(jsonObject, function (schema) {
                        resolve(schema);
                    });
                });
            }
        };
    }]);