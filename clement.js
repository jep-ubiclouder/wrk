<script type="text/javascript">
        
            /* 
            ** Architecture des données coté serveur : 
            **
            **  BOARD                   LIST                TASK
            ** board_01     -> list_01  -> task_01
            **                                              -> task_02
            **                                              -> task_03
            **                                          
            **                      -> list_AA  -> task_AA
            **                                              -> task_AB
            **                                          
            ** board_02     -> list_01  -> task_01
            **                                              -> task_02
            **                                          
            **                      -> list_02  -> task_AA
            **                                              -> task_AB
            **                                              -> task_AC
            **                                          
            ** board_03     -> list_01  -> foo
            */              
            
            /* 
            ** 3 variables/objets majeurs coté client :
            ** - 'boardSelected' => id de la board sélectionnée
            ** - 'listSelected' => id de la list sélectionnée
            ** - 'mainArray' => tableau répertoriant les task groupées par status
            */
            
            /* 
            ** Structure de mainArray
            ** mainArray => [status_0 status_1 status_2 ...]
            **          status => var 'status' : valeur du status (ex: 'Normal') (voir le constructeur 'arrayTask')
            **                          var 'task' => [task_0 task_1 task_2 ...]
            **              task => var id, var date, var subject ... (voir le constructeur 'task')
            **                  
            ** Exemple de syntaxe pour accéder au 'subject' d'une task : mainArray[index_i].task[index_j].subject
            */
            
            /* 
            ** Utilisation de jquery et de jquery-ui
            ** 'selectmenu' =>  http://api.jqueryui.com/selectmenu/ ou http://jqueryui.com/selectmenu/#default
            ** 'sortable'       =>  http://api.jqueryui.com/sortable/ ou http://jqueryui.com/sortable/#portlets
            ** 'dialog'         =>  http://api.jqueryui.com/dialog/ ou http://jqueryui.com/dialog/#modal-form
            ** 'datepicker' =>  http://api.jqueryui.com/datepicker/ ou http://jqueryui.com/datepicker/#default 
            */
        
            /* Déclaration des variables, objects et constructeurs */
            var boardSelected;
            var listSelected;
            var j$ = $.noConflict();
            var checkStatusChange = false;
            var mainArray = [];
            var thisStatus = null;
            var titleColorArray = [];
            
            
            
            function titleColor(color, used) {
                this.color = color;
                this.used = used;
            }

            function arrayTask(status, task) {
                this.status = status;
                this.task = task;
            }

            function task(id, date, priority, subject, description, status, owner, photo) {
                this.id = id;
                this.date = date;
                this.priority = priority;
                this.subject = subject;
                this.description = description;
                this.status = status;
                this.owner = owner;
                this.photo = photo;
            }
            
            /* 
            ** Ici est le commencement de toutes choses !
            ** Appel à 'getRemoteStatusTask' pour set les status au DOM et à 'mainArray'
            ** Appel à 'getRemoteBoard' pour lister les "board"
            ** Application de jquery-ui 'selectmenu' aux drop down list et set de leurs callback function
            ** Création du formulaire d'ajout d'une tache
            */
            j$(document).ready(function() {
                getRemoteStatusTask();
                getRemoteBoard();
                /* Si on sélectionne une autre board : appel de 'getRemoteList' */
                j$("#board").selectmenu({
                    change: function(event, ui) {
                        boardSelected = ui.item.value;
                        getRemoteList();
                    }
                });
                /* Si on sélectionne une autre list : appel de 'getRemoteTask' */
                j$("#list").selectmenu({
                    change: function(event, ui) {
                        listSelected = ui.item.value;
                        getRemoteTask();
                    }
                });
                /* Création du formulaire d'ajout d'une nouvelle tache */
                createFormAddNewTask();
            });
            
            /* 
            ** Fonction qui set la drop down list des board et la variable 'boardSelected'
            ** RemoteAction 'getBoard' renvoie les board
            ** Appel de la fonction 'getRemoteList'
            */
            function getRemoteBoard() {
                var i = -1;
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getBoard}', function(result, event) {
                    if (event.status) {
                        while (++i < result.length) {
                            if (i == 0)
                                j$("#board").append('<option value="' + result[i].Id + '" selected="selected">' + result[i].Ubitask__Board_Name__c + '</option>');
                            else
                                j$("#board").append('<option value="' + result[i].Id + '">' + result[i].Ubitask__Board_Name__c + '</option>');
                        }
                        j$("#board").selectmenu("refresh");
                        boardSelected = j$("#board").val();
                        getRemoteList();
                    }
                }, {escape: true});
            }
            
            /* 
            ** Fonction qui set la drop down list des list et la variable 'listSelected' 
            ** RemoteAction 'getList' => prend en paramère 'boardSelected' et renvoie les list de la board
            ** Appel de fonction 'getRemoteTask'
            */
            function getRemoteList() {
                console.log('board: ' + boardSelected);              // DEBUG
                var i = -1;
                j$('#list').empty();
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getList}', boardSelected, function(result, event) {
                    if (event.status) {
                        while (++i < result.length) {
                            if (i == 0)
                                j$("#list").append('<option value="' + result[i].Id + '" selected="selected">' + result[i].Ubitask__List_Name__c + '</option>');
                            else
                                j$("#list").append('<option value="' + result[i].Id + '">' + result[i].Ubitask__List_Name__c + '</option>');
                        }
                        if (result.length == 0)
                            j$('#list').append('<option value="emptyBoard">Empty board !</option>');
                        j$("#list").selectmenu("refresh");
                        listSelected = j$("#list").val();
                        getRemoteTask();
                    }
                }, {escape: true});
            }
            
            /* 
            ** Fonction qui retourne la source de l'icon du status passé en paramètre 
            ** Fonction appelée lors de l'ajout au DOM des status (colonnes) : 'getRemoteStatusTask'
            */
            function getIconStatus(status) {
                if (status == 'Not Started')
                    return '{!URLFOR($Resource.icons, 'not_started.png')}';
                if (status == 'In Progress')
                    return '{!URLFOR($Resource.icons, 'in_progress.png')}';
                if (status == 'Completed')
                    return '{!URLFOR($Resource.icons, 'completed.png')}';
                if (status == 'Waiting on someone else' || status =='Blocked')
                    return '{!URLFOR($Resource.icons, 'waiting.png')}';
                if (status == 'Deferred')
                    return '{!URLFOR($Resource.icons, 'deferred.png')}';
                return null;
            }

            /* 
            ** Initialise un tableau de couleur
            ** PAS UTILISE
            */
            function initTitleColorArray() {
                var colorArray = ['#ff1c1c', '#ff911c', '#fbff16', '#a0ff11', '#11ff55', '#11ff9c', '#11f3ff', '#1198ff', '#6a14ff', '#f314ff'];
                var i = -1;
                while (++i < colorArray.length) {
                    var newTitleColor = new titleColor(colorArray[i], false);
                    titleColorArray.push(newTitleColor);
                }
            }

            /* 
            ** Donne une couleur aléatoire non utilisée
            ** Appelé par 'getRemoteStatusTask'
            ** PAS UTILISE
            */
            function getTitleColor() {
                var rand = Math.floor((Math.random() * (titleColorArray.length)));
                if (titleColorArray[rand].used == true)
                    return getTitleColor();
                titleColorArray[rand].used = true;
                return titleColorArray[rand].color;
            }
            
            /* 
            ** Fonction qui récupère et ajoute les status
            ** - au DOM
            ** - à 'mainArray'
            */
            function getRemoteStatusTask() {
                var i = -1;
                // initTitleColorArray();
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getStatusTask}', function(result, event) {
                    if (event.status) {
                        while (++i < result.length) {
                            var col = new arrayTask(result[i].label, null);
                            mainArray.push(col);
                            j$('#mainDiv').append('<div id="col' + i +'" class="column"><div class="titleStatus"><img class="iconsStatus" src="' + getIconStatus(result[i].value) + '" style="width:32px;height:32px;"><p class="statusTask">' + result[i].label + '</p><p class="numberTask"></p></div></div>');
                            // j$('#col' + i + ' .titleStatus').css("background-color", getTitleColor());
                            //j$('#col' + ' .Column').css("width", '150px');
                        }
                        //j$('#col' + ' .Column').css("width", '150px');
                        var Columns=j$('.column').length;
                        console.log('Column number = '  + Columns);
                        var ColumnSize = 800 / Columns;
                        console.log('Column size = '  + ColumnSize );
                        j$('.column').css("width", ColumnSize +'px');
                    }
                }, {escape: true});
            }
            
            /* Fonction récursive qui trie les task de 'mainArray' en fonction de leur deadline */
            function sortTaskDate() {
                var i = -1;
                var j;
                while (++i < mainArray.length) {
                    j = -1;
                    while (++j < mainArray[i].task.length) {
                        if (j + 1 < mainArray[i].task.length && mainArray[i].task[j].date > mainArray[i].task[j + 1].date) {
                            var tmpTask = new task(mainArray[i].task[j + 1].id, mainArray[i].task[j + 1].date, mainArray[i].task[j + 1].priority, mainArray[i].task[j + 1].subject, mainArray[i].task[j + 1].description, mainArray[i].task[j + 1].status, mainArray[i].task[j + 1].owner, mainArray[i].task[j + 1].photo);
                            delete mainArray[i].task[j + 1];
                            mainArray[i].task[j + 1] = mainArray[i].task[j];
                            delete mainArray[i].task[j];
                            mainArray[i].task[j] = tmpTask;
                            return sortTaskDate();
                        }
                    }
                }
                // console.log(mainArray);                             // DEBUG
            }
            
            /* 
            ** Fonction qui récupère et ajoute les task à 'mainArray'
            ** RemoteAction 'getTask' => prend en paramètre 'listSelected' et renvoie une liste des task
            ** Une fois 'mainArray' peuplé, appel des fonctions 'sortTaskDate' et 'displayTask'
            ** qui respectivement trient les task en fonction de leur deadline et procède à l'affichage
            */
            function getRemoteTask() {
                console.log('list: ' + listSelected);               // DEBUG
                var i = -1;
                var j;
                if (listSelected == 'emptyBoard')
                    listSelected = null;
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getTask}', listSelected, function(result, event) {
                    if (event.status) {
                        while (++i < mainArray.length) {
                            j = -1;
                            var tab = [];
                            while (result && ++j < result.length) {
                                if (result[j].status == mainArray[i].status) {
                                    if (result[j].description && result[j].description.length > 200)
                                        result[j].description = result[j].description.slice(0, 200);
                                    if (result[j].name.length > 20)
                                        result[j].name = result[j].name.slice(0, 20);
                                    var newTask = new task(result[j].taskId, result[j].deadLine, result[j].priority, result[j].name, result[j].description, result[j].status, result[j].owner, result[j].smallPhoto);
                                    tab.push(newTask);
                                }
                            }
                            mainArray[i].task = tab;
                        }
                        sortTaskDate();
                        displayTask();
                    }
                }, {escape: true});
            }
            
            /* 
            ** Fonction appelée par 'updateMainArray'
            ** Prend en paramètre l'id de la task et le nouveau status et effectue la mise à jour du status de la task coté serveur
            ** RemoteAction 'updateStatusTask' => prend en paramètre 'id' = id task , 'newStatus' = nouveau status
            */
            function updateStatusTask(id, newStatus) {
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.updateStatusTask}', id, newStatus, function(result, event) {
                    if (event.status) {
                        result = j$("<div/>").html(result).text();
                        console.log(result);                                  // DEBUG
                    }
                }, {escape: true});
            }

            /* 
            ** Fonction appelée lors du déplacement d'une task vers un autre status (colonne) 
            ** Prend en paramètre l'id de la task et le nouveau status et effectue la mise à jour du status de la task dans 'mainArray'
            ** Appel de la fonction 'updateStatusTask' pour mise à jour coté serveur
            */  
            function updateMainArray(index, thisId) {
                var i = -1;
                var j;
                while (++i < mainArray.length) {
                    j = -1;
                    while (++j < mainArray[i].task.length) {
                        if (thisId == mainArray[i].task[j].id && mainArray[index].status != mainArray[i].task[j].status) {
                            var taskMoved = new task(mainArray[i].task[j].id, mainArray[i].task[j].date, mainArray[i].task[j].priority, mainArray[i].task[j].subject, mainArray[i].task[j].description, mainArray[index].status, mainArray[i].task[j].owner, mainArray[i].task[j].photo);
                            mainArray[index].task.push(taskMoved);
                            mainArray[i].task.splice(j, 1);
                            updateStatusTask(thisId, mainArray[index].status);
                        }
                    }
                }
            }

            /* 
            ** Fonction qui affiche le message d'erreur du formulaire d'ajout d'une nouvelle tache 
            ** Appelée par 'checkFieldForm'
            */
            function displayErrorMessage(text) {
                j$(".validateTips")
                    .text(text)
                    .addClass("ui-state-highlight");
                setTimeout(function() {
                    j$(".validateTips").removeClass("ui-state-highlight", 1500);
                }, 500);
            }
            
            /* 
            ** Fonction qui check si 'pattern' existe dans 'field'
            ** 'field' correspond à la valeur d'un champs de type input texte ou textarea du formulaire d'ajout d'une nouvelle tache 
            ** Renvoie 'true' si match sinon 'false'
            ** Appelée par 'checkFieldForm' 
            */
            function checkRegExp(field, pattern) {
                return (pattern.test(field));
            }
            
            /* 
            ** Fonction qui check les différents champs du formulaire d'ajout d'une nouvelle tache
            ** Appelée par 'addNewTask()'
            ** Si erreur, indique un message d'erreur, applique une class css d'erreur au champ et return false
            ** Sinon return true
            */
            function checkFieldForm() {
                if (j$('#formTaskOwner').val() == null) {
                    displayErrorMessage('Please select an owner !');
                    j$('#formTaskOwner-button').addClass('fieldFormError');
                    return false;
                }
                if (j$('#formTaskSubject').val() == null) {
                    displayErrorMessage('Please select a subject !');
                    j$('#formTaskSubject-button').addClass('fieldFormError');
                    return false;
                }
                if (j$('#formTaskSubject').val() == 'customSubject' && j$('#formTaskSubjectCustom').val() == '') {
                    displayErrorMessage('Please enter a custom subject !');
                    j$('#formTaskSubjectCustom').addClass('fieldFormError');
                    return false;
                }
                if (checkRegExp(j$('#formTaskSubjectCustom').val(), /[:]/)) {
                    displayErrorMessage("Please not use ' : ' character !");
                    j$('#formTaskSubjectCustom').addClass('fieldFormError');
                    return false;
                }           
                if (j$('#formTaskPriority').val() == null) {
                    displayErrorMessage('Please select a priority !');
                    j$('#formTaskPriority-button').addClass('fieldFormError');
                    return false;
                }
                if (j$('#formTaskDeadLine').val() == '') {
                    displayErrorMessage('Please select a deadline !');
                    // j$('#formTaskDeadLine').addClass('fieldFormError');
                    return false;
                }
                    if (j$('#formTaskDescription').val() && checkRegExp(j$('#formTaskDescription').val(), /[:]/)) {
                    displayErrorMessage("Please not use ' : ' character !");
                    j$('#formTaskDescription').addClass('fieldFormError');
                    return false;
                }
                return true;
            }
            
            /* 
            ** Ajout d'une nouvelle task coté serveur via le formulaire
            ** Les données de la nouvelle tache sont issues du formulaire
            ** Construction d'une string 'newTask' donnée en paramètre par RemoteAction 'addTask'
            ** Structure de 'newTask' => 'owner_id:subject:YYYY:MM:DD:priority:status:list_id:description'
            ** RemoteAction 'addTask' renvoie la task nouvelement crée
            ** Ajout de cette tache à 'mainArray'
            ** Appel des fonctions
            **          'sortTaskDate'      => trie les task de 'mainArray' en fonction de leur deadline 
            **          'refreshDisplay'    => refresh le display de la colonne (qui correspond au status 
            **                                                   de la task ajoutée) passée en paramètre 
            */
            function addNewTask() {
                var subject = null;
                if (!checkFieldForm())
                    return false;
                if (j$('#formTaskSubject').val() == 'customSubject')
                    subject = j$('#formTaskSubjectCustom').val();
                else
                    subject = j$('#formTaskSubject').val();
                var newTask = j$('#formTaskOwner').val() + ':' + subject + ':' + j$('#formTaskDeadLine').datepicker('getDate').getFullYear() + ':' + (j$('#formTaskDeadLine').datepicker('getDate').getMonth() + 1) + ':' + j$('#formTaskDeadLine').datepicker('getDate').getDate() + ':' + j$('#formTaskPriority').val() + ':' + thisStatus + ':' + listSelected + ':' + j$('#formTaskDescription').val();
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.addTask}', newTask, function(result, event) {
                    if (event.status) {
                        newTask = new task(result.taskId, result.deadLine, result.priority, result.name, result.description, result.status, result.owner, result.smallPhoto);
                        var i = -1;
                        var index = -1;
                        while (++i < mainArray.length) {
                            if (mainArray[i].status == thisStatus) {
                                mainArray[i].task.push(newTask);
                                index = i;
                            }
                        }
                        j$('#formAddTask').dialog('close');
                        sortTaskDate();
                        refreshDisplay(index);
                    }
                }, {escape: true});
            }
            
            /* 
            ** Ajout d'une icon si la date de la tache est la meme que le jour meme ou dépassée 
            ** Appelée par 'refreshDisplay' et 'displayTask'
            */
            function checkDateTask(i, j) {
                var selector = '#' + mainArray[i].task[j].id + ' .deadLine';
                var today = new Date();
                var deadLine = new Date(mainArray[i].task[j].date);
                today = Date.parse(today.getUTCFullYear() + '-' + (today.getUTCMonth() + 1) + '-' + today.getUTCDate());
                deadLine = Date.parse(deadLine.getUTCFullYear() + '-' + (deadLine.getUTCMonth() + 1) + '-' + deadLine.getUTCDate());
                if (deadLine == today)
                    j$(selector).append('<img class="warningDate" src="{!URLFOR($Resource.icons, 'ra.png')}">');
                else if (deadLine < today)
                    j$(selector).append('<img class="warningDate" src="{!URLFOR($Resource.icons, 're.png')}">');
            }
            
            /* 
            ** Idem que 'displayTask' mais refresh l'affichage d'une seule colonne
            ** Appelée lors de l'ajout d'une tache ou un changement de status d'une tache (déplacement)
            ** Prend en paramètre 'index' qui correspond à l'index de la colonne à refesh
            ** Parcours de 'mainArray' et ajout au DOM des task et autres informations
            ** Appel à 'applyJqueryUi' pour set le rendu "Sortable Portlets" ainsi que les callback function
            */
            function refreshDisplay(index) {
                /* suppression des taches présentes dans la colonne et du boutton 'Add task'*/
                var selector = '#col' + index + ' > .portlet';
                j$(selector).remove();
                j$('#col' + index + ' > .addTask').remove();
                /* ajout du nombre de task dans la colonne */
                if (mainArray[index].task.length > 0)
                    j$('#col' + index + ' .numberTask').text(mainArray[index].task.length);
                var j = -1;
                while (++j < mainArray[index].task.length) {
                    /* ajout du 'portlet' */
                    var selector = '#col' + index;
                    var div = '<div id="' + mainArray[index].task[j].id + '" class="portlet"><div class="portlet-header"></div><div class="portlet-content"></div></div>';
                    j$(selector).append(div);
                    /* ajout du subject de la tache dans le 'portlet-header' */
                    selector = '#' + mainArray[index].task[j].id + ' .portlet-header';
                    j$(selector).append('<span id="link' + mainArray[index].task[j].id + '" class="subjectTask">' + mainArray[index].task[j].subject + '</span>');
                    /* set du contenu du 'portlet' */
                    selector = '#' + mainArray[index].task[j].id + ' .portlet-content';
                    /* ajout de la date */
                    var date = new Date(mainArray[index].task[j].date);
                    var infoDate = date.getUTCDate() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCFullYear();
                    j$(selector).append('<div class="deadLine">' + infoDate + '<div id="PI' + mainArray[index].task[j].id + '" class="priorityIcon"></div></div>');
                    /* ajout de l'icone de retard si la tache est en retard par rapport à la date */
                    if (mainArray[index].status != 'Completed' && mainArray[index].status != 'Deferred')
                        checkDateTask(index, j);
                    /* ajout de la description si il y en a une */  
                    if (mainArray[index].task[j].description)
                        j$(selector).append('<div class="separate">' + mainArray[index].task[j].description + '</div>');
                    /* ajout du propriétaire et de sa photo */
                    j$(selector).append('<div class="separate"><img class="userPhoto" src="' + mainArray[index].task[j].photo + '" style="width:32px;height:32px;"><p>' + mainArray[index].task[j].owner + '</p></div>');
                    /* ajout de l'icone de priorité */
                    selector = '#PI' + mainArray[index].task[j].id;
                    if (mainArray[index].task[j].priority == 'Low')
                        j$(selector).css('background-color', '#81b6e8');
                    else if (mainArray[index].task[j].priority == 'Normal')
                        j$(selector).css('background-color', '#81e887');
                    else
                        j$(selector).css('background-color', '#e88181');
                    /* ajout ou retrait du background 'completed' si la tache est finie ou non */   
                    if (mainArray[index].status == 'Completed')
                        j$('#col' + index + ' .portlet-content').addClass('taskCompleted');
                    else
                        j$('#col' + index + ' .portlet-content').removeClass('taskCompleted');
                }
                /* ajout en fin de colonne le boutton 'Add task' */
                selector = '#col' + index;
                j$(selector).append('<div class="addTask">Add a task...</div>');
                applyJqueryUi();
            }
            
            /* 
            ** Fonction uniquement appelée au chargement d'une list, par 'getRemoteTask'
            ** Elle ajoute au DOM toutes les taches et infos de 'mainArray' pour application de jquery-ui
            ** Appel à 'applyJqueryUi' pour set le rendu "Sortable Portlets" ainsi que les callback function
            */
            function displayTask() {
                var i = -1;
                var j;
                /* suppression des taches présentes dans la colonne et du boutton 'Add task'*/
                j$('.portlet, .addTask').remove();
                /* suppression des nombres de taches par colonne */
                j$('.numberTask').text('');
                while (++i < mainArray.length) {
                    j = -1;
                    /* ajout du nombre de tache dans la colonne */
                    if (mainArray[i].task.length > 0)
                        j$('#col' + i + ' .numberTask').text(mainArray[i].task.length);
                    while (++j < mainArray[i].task.length) {
                        /* ajout du 'portlet' */
                        var selector = '#col' + i;
                        var div = '<div id="' + mainArray[i].task[j].id + '" class="portlet"><div class="portlet-header"></div><div class="portlet-content"></div></div>';
                        j$(selector).append(div);
                        /* ajout du subject de la tache dans le 'portlet-header' */
                        selector = '#' + mainArray[i].task[j].id + ' .portlet-header';
                        j$(selector).append('<span id="link' + mainArray[i].task[j].id + '" class="subjectTask">' + mainArray[i].task[j].subject + '</span>');
                        /* set du contenu du 'portlet' */
                        selector = '#' + mainArray[i].task[j].id + ' .portlet-content';
                        /* ajout de la date */
                        var date = new Date(mainArray[i].task[j].date);
                        var infoDate = date.getUTCDate() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCFullYear();
                        /* ajout de l'icone de retard si la tache est en retard par rapport à la date */
                        j$(selector).append('<div class="deadLine">' + infoDate + '<div id="PI' + mainArray[i].task[j].id + '" class="priorityIcon"></div></div>');
                        if (mainArray[i].status != 'Completed' && mainArray[i].status != 'Deferred')
                            checkDateTask(i, j);
                        /* ajout de la description si il y en a une */  
                        if (mainArray[i].task[j].description)
                            j$(selector).append('<div class="separate">' + mainArray[i].task[j].description + '</div>');
                        /* ajout du propriétaire et de sa photo */  
                        j$(selector).append('<div class="separate"><img class="userPhoto" src="' + mainArray[i].task[j].photo + '" style="width:32px;height:32px;"><p>' + mainArray[i].task[j].owner + '</p></div>');
                        /* ajout de l'icone de priorité */
                        selector = '#PI' + mainArray[i].task[j].id;
                        if (mainArray[i].task[j].priority == 'Low')
                            j$(selector).css('background-color', '#81b6e8');
                        else if (mainArray[i].task[j].priority == 'Normal')
                            j$(selector).css('background-color', '#81e887');
                        else
                            j$(selector).css('background-color', '#e88181');
                        /* ajout du background 'completed' si la tache est finie */     
                        if (mainArray[i].status == 'Completed')
                            j$('#col' + i + ' .portlet-content').addClass('taskCompleted');
                    }
                    /* ajout en fin de colonne le boutton 'Add task' */
                    selector = '#col' + i;
                    j$(selector).append('<div class="addTask">Add a task...</div>');
                }
                applyJqueryUi();
            }
            
            /* 
            ** Application de jquery-ui pour set le rendu "Sortable Portlets"
            ** Voir https://jqueryui.com/sortable/#portlets ou http://api.jqueryui.com/sortable/ pour la doc
            ** Appelée par 'displayTask' et 'refreshDisplay'
            */
            function applyJqueryUi() {
                j$(document).ready(function() {
                    j$(".column").sortable({
                        items: ".portlet",
                        connectWith: ".column",
                        handle: ".portlet-header",
                        cancel: ".portlet-toggle",
                        placeholder: "portlet-placeholder ui-corner-all",
                        /* 
                        ** Callback function quant une colonne reçoit une task
                        ** Mise à jour de 'mainArray' et mise à jour de status de la tache coté serveur 
                        ** Tri des task par date et refresh de la colonne
                        */
                        receive: function(event, ui) {
                            checkStatusChange = true;
                            var index = j$(this).attr('id').slice(3);
                            var thisId = ui.item[0].id;
                            updateMainArray(index, thisId);
                            sortTaskDate();
                            refreshDisplay(index);
                        },
                        /* 
                        ** Callback function quant une task est déplacée
                        ** Si une tache est déplacée mais reste dans la meme colonne, on annule le déplacement
                        ** Mise à jour du nombre de task par status affiché
                        */
                        stop: function(event, ui) {
                            if (checkStatusChange == false)
                                j$('#' + j$(this).attr('id')).sortable('cancel');
                            checkStatusChange = false;
                            var index = j$(this).attr('id').slice(3);
                            if (mainArray[index].task.length > 0)
                                j$('#' + j$(this).attr('id') + ' .numberTask').text(mainArray[index].task.length);
                            else
                                j$('#' + j$(this).attr('id') + ' .numberTask').text('');
                        }
                    });
                    j$(".portlet")
                        .addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
                        .find(".portlet-header")
                        .addClass("ui-widget-header ui-corner-all")
                        .prepend("<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>")
                    j$(".portlet-toggle").on("click", function() {
                        var icon = j$(this);
                        icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
                        icon.closest(".portlet").find(".portlet-content").toggle();
                    });
                    /* 
                    ** Mise en place du l'écouteur quant on clique sur le subject de la task
                    ** Evenement : ouverture de la page salesforce de la tache
                    */
                    j$('.portlet-header > .subjectTask').off('click');
                    j$('.portlet-header > .subjectTask').click(function() {
                        window.open('https://ubitasks-dev-ed.my.salesforce.com/' + j$(this).attr('id').slice(4));
                    });
                    /* Mise en place de l'ouverture du formulaire de création d'une tache */
                    j$('.addTask').off('click');
                    j$('.addTask').click(function() {
                        if (listSelected == null)
                            alert('This board is empty (no list) ! Please change board.');
                        else {
                            j$('#formAddTask').dialog("open");
                            var index = j$(this).parent().attr('id').slice(3);
                            thisStatus = mainArray[index].status;
                        }
                    });
                });
            }
            
            /* 
            ** Création du formulaire d'ajout d'une nouvelle tache
            ** Utilisation de jquery-ui
            ** voir http://jqueryui.com/dialog/#modal-form ou http://api.jqueryui.com/dialog/ pour la doc du formulaire
            */
            function createFormAddNewTask() {
                var i;
                /* 
                ** Set de la drop down list du "propriétaire"
                ** Appel à RemoteAction 'getUser' qui renvoie les users
                ** Application de jquery-ui 'selectmenu' au champ
                */
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getUser}', function(result, event) {
                    if (event.status) {
                        i = -1;
                        while (++i < result.length) {
                            j$('#formTaskOwner').append('<option value="' + result[i].Id + '">' + result[i].Name + '</option>');
                        }
                        j$("#formTaskOwner").selectmenu({
                            change: function( event, ui ) {
                                j$('#formTaskOwner-button').removeClass('fieldFormError');
                            }
                        });
                    }
                }, {escape: true});
                /* 
                ** Set de la drop down list du "subject"
                ** Appel à RemoteAction 'getSubjectOfTask' qui renvoie les subject par défaut
                ** Si l'option 'Custom subject' est sélectionnée, apparition d'un champ input text pour un "custom subject"
                ** Application de jquery-ui 'selectmenu' au champ
                */
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getSubjectOfTask}', function(result, event) {
                    if (event.status) {
                        i = -1;
                        while (++i < result.length) {
                            j$('#formTaskSubject').append('<option value="' + result[i].value + '">' + result[i].label + '</option>');
                        }
                        j$('#formTaskSubject').append('<option value="customSubject">Custom subject</option>');
                        j$('#formTaskSubjectCustom').hide();
                        j$('#formTaskSubjectCustom').keypress(function() {
                            j$('#formTaskSubjectCustom').removeClass('fieldFormError');
                        });
                        j$("#formTaskSubject").selectmenu({
                            change: function(event, ui) {
                                j$('#formTaskSubject-button').removeClass('fieldFormError');
                                if (ui.item.value == 'customSubject') {
                                    j$('#formTaskSubjectCustom').show();
                                }
                                else {
                                    j$('#formTaskSubjectCustom').hide();
                                }
                            }
                        });
                    }
                }, {escape: true});
                /* 
                ** Set de la drop down list des "priority" 
                ** Appel à RemoteAction 'getPriorityOfTask' qui renvoie les priority
                ** Application de jquery-ui 'selectmenu' au champ
                */
                Visualforce.remoting.Manager.invokeAction('{!$RemoteAction.mainController.getPriorityOfTask}', function(result, event) {
                    if (event.status) {
                        i = -1;
                        while (++i < result.length) {
                            j$('#formTaskPriority').append('<option value="' + result[i].value + '">' + result[i].label + '</option>');
                        }
                        j$("#formTaskPriority").selectmenu({
                            change: function( event, ui ) {
                                j$('#formTaskPriority-button').removeClass('fieldFormError');
                            }
                        });
                    }
                }, {escape: true});
                /* Set du champ de la "deadline", application de jquery-ui "datepicker" */
                j$("#formTaskDeadLine").datepicker();
                /* 
                ** Set du formulaire 
                ** button 'Add task' => appel de la function 'addNewTask'
                ** button 'Cancel' => appel de la function 'close' qui retire toutes les class css d'erreur
                **                                      et reset le formulaire
                */
                j$('#formAddTask').dialog({
                    autoOpen: false,
                height: 615,
                width: 395,
                modal: true,
                buttons: {
                    'Add task': addNewTask,
                    Cancel: function() {
                        j$('#formAddTask').dialog('close');
                    }
                },
                close: function() {
                    j$('#formTaskOwner-button').removeClass('fieldFormError');
                    j$('#formTaskSubject-button').removeClass('fieldFormError');
                    j$('#formTaskSubjectCustom').removeClass('fieldFormError');
                    j$('#formTaskPriority-button').removeClass('fieldFormError');
                        j$('#formTaskDescription').removeClass('fieldFormError');
                    j$('#formAddTask form')[0].reset();
                    j$('#formTaskSubjectCustom').hide();
                    j$(".validateTips").text('* required field');
                    }
                });
            }
        </script>