/*
This tool provide a possibility to review and update event categories, actions and labels in GTM with a help of Google Sheet.
Developed by Dmytro Bulakh, 2018,
repo: https://github.com/postman31/sheet-gtm-naming.git
MIT licence
*/

var DEBUG = true

var Editor = function () {
  this.spreadsheet = SpreadsheetApp.getActive()
  Logger.log(this.spreadsheet.getUrl())
  this.header = ['tagId', 'name', 'eventCategory', 'eventAction' , 'eventLabel']
  return this.getAccounts()
}

Editor.prototype.getPropRange = function (propName) {
  return this.spreadsheet.getRangeByName(propName)
}

Editor.prototype.getProp = function (propName) {
  return (this.getPropRange(propName)) ? this.getPropRange(propName).getValue() : null
}

Editor.prototype.setProp = function (propName, value) {
  return (this.getPropRange(propName)) ? this.getPropRange(propName).setValue(value) : null
}

Editor.prototype.getAccounts = function () {
  this.accounts = TagManager.Accounts.list().account
  this.accountDisplayNames = this.accounts.map(function (account) { return account.name + ' : ' + account.accountId} )
  return this
}

Editor.prototype.getContainers = function () {
  var account = this.getProp('Account')
  if (!account) {
    this.alert('No accounts selected')
    return this
  }
  var accountObject = this.accounts[this.accountDisplayNames.indexOf(account)]
  this.containers = TagManager.Accounts.Containers.list('accounts/' + accountObject.accountId).container
  this.containerDisplayList = this.containers.map(function(container) { return container.name + ' : ' + container.publicId })
  return this
}

Editor.prototype.getWorkspaces = function () {
  var account = this.getProp('Account')
  if (!account) {
    this.alert('No accounts selected')
    return this
  }
  var container = this.getProp('Container')
  if (!container) {
    this.alert('No containers selected')
    return this
  }
  var accountObject = this.accounts[this.accountDisplayNames.indexOf(account)]
  var containertObject = this.containers[this.containerDisplayList.indexOf(container)]
  this.workspaces = TagManager.Accounts.Containers.Workspaces.list('accounts/' + accountObject.accountId + '/containers/' + containertObject.containerId).workspace
  this.workspaceDisplayList = this.workspaces.map(function(workspace) { return workspace.name + ' : ' + workspace.workspaceId })
  return this
}

Editor.prototype.getProps = function () {
  var account = this.getProp('Account')
  if (!account) {
    this.alert('No accounts selected')
    return null
  }
  var container = this.getProp('Container')
  if (!container) {
    this.alert('No containers selected')
    return null
  }
  var workspace = this.getProp('Workspace')
  if (!workspace) {
    this.alert('No workspace selected')
    return null
  }

  var accountObject = this.accounts[this.accountDisplayNames.indexOf(account)]
  var containertObject = this.containers[this.containerDisplayList.indexOf(container)]
  var workspaceObject = this.workspaces[this.workspaceDisplayList.indexOf(workspace)]

  return {
    accountObject: accountObject,
    containertObject: containertObject,
    workspaceObject: workspaceObject
  }
}

Editor.prototype.getTags = function () {
  var props = this.getProps()
  if (!props) return this
  var path = 'accounts/' + props.accountObject.accountId + '/containers/'
  + props.containertObject.containerId + '/workspaces/' + props.workspaceObject.workspaceId
  this.tags = TagManager.Accounts.Containers.Workspaces.Tags.list(path).tag
  this.tags = this.tags.filter(function (tag) { return tag.type == "ua" && getParameter(tag.parameter, 'trackType') == "TRACK_EVENT"})
  this.triggers = TagManager.Accounts.Containers.Workspaces.Triggers.list(path).trigger
  this.triggerNames = this.triggers.reduce(function (acc, trigger) { acc[trigger.triggerId] = trigger.name; return acc}, {})
  return this
}

Editor.prototype.validAccount = function () {
  var account = this.getProp('Account')
  return (this.accountDisplayNames && this.accountDisplayNames.indexOf(account) != -1)
}

Editor.prototype.validContainer = function () {
  var container = this.getProp('Container')
  return (this.containerDisplayList && this.containerDisplayList.indexOf(container) != -1)
}

Editor.prototype.validWorkspace = function () {
  var workspace = this.getProp('Workspace')
  return (this.workspaceDisplayList && this.workspaceDisplayList.indexOf(workspace) != -1)
}

Editor.prototype.alert = function (msg) {
  var ui = SpreadsheetApp.getUi()
  .alert(msg);
}

Editor.prototype.accountsToDropDown = function () {
  var accountCell = this.getPropRange('Account').clear()
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(this.accountDisplayNames, true).build();
  accountCell.setDataValidation(rule)
  var containerCell = this.getPropRange('Container').clear().clearDataValidations()
  var workspaceCell = this.getPropRange('Workspace').clear().clearDataValidations()
}

Editor.prototype.containersToDropDown = function () {
  this.getContainers()
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(this.containerDisplayList, true).build();
  var containerCell = this.getPropRange('Container').clear()
  containerCell.setDataValidation(rule)
  containerCell.setValue(this.containerDisplayList[0])
  var workspaceCell = this.getPropRange('Workspace').clear().clearDataValidations()
  this.setProp('TagsStart', 'Select container and workspace to list the tags')
  this.setProp('Workspace', null)
  return this.clearTags(true)
}

Editor.prototype.workspacesToDropDown = function () {
  this.getWorkspaces()
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(this.workspaceDisplayList, true).build();
  var workspaceCell = this.getPropRange('Workspace').clear()
  workspaceCell.setDataValidation(rule)
  workspaceCell.setValue(this.workspaceDisplayList[0])
  this.setProp('TagsStart', 'Select workspace to list the tags')
  return this.clearTags(true)
}

function getParameter(list, key) {
  return list.reduce(function(acc, item) { if (item.key == key) acc = item; return acc}, {'value': null })['value']
}

function setParameter(list, key) {
  return list.reduce(function(acc, item) { if (item.key == key) acc = item; return acc}, {'value': null })['value']
}

Editor.prototype.clearTags = function (reset) {
  var startRow = this.getPropRange('TagsStart').getRow() + 1
  var sheet = this.getPropRange('TagsStart').getSheet()
  if (sheet.getLastRow() == startRow - 1) return this
  sheet.getRange(startRow, 1, (sheet.getLastRow() - startRow + 1), this.header.length + 2).clear().clearDataValidations()
  if (reset) {
  this.tags = []
  this.triggers = []
  }
  var filter = sheet.getFilter()
  if (filter) {filter.remove()}
  return this
}

Editor.prototype.listEventTags = function () {
  this.clearTags()
  var sheet = this.getPropRange('TagsStart').getSheet()
  var header = this.header.slice()
  header.push('trigger')
  this.setProp('TagsStart', 'here\'are the tags')
  var startRow = this.getPropRange('TagsStart').getRow() + 2
  sheet.getRange(startRow - 1, 1, 1, header.length).setValues([header])
  var self = this
  var tagValues = this.tags.map( function(tag) {
    return header.map(function (colName) {
      if (colName == 'trigger') {
        return tag['firingTriggerId'].map(function (id) {return self.triggerNames[id]}).join(', ')
      }
      if (tag[colName]) {
        return tag[colName]
      }
      return getParameter(tag.parameter, colName)
    })
  })
  Logger.log(tagValues)
  sheet.getRange(startRow, 1, tagValues.length, header.length).setValues(tagValues)
  this.tagValues = tagValues
  sheet.getRange(startRow - 1, header.length + 1, 1, 1).setValue('update')
  var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build()
  sheet.getRange(startRow, header.length + 1, tagValues.length, 1).setDataValidation(rule)
  sheet.getRange(startRow -1 , 1, tagValues.length + 1, header.length + 1).createFilter()
  /*
  sheet.clearConditionalFormatRules()
  //var defaultBack = ''
  var conditionsRules = sheet.getConditionalFormatRules();
  Logger.log(conditionsRules)
  var fields = ['eventCategory', 'eventAction' , 'eventLabel']
  for (var i = 0; i < tagValues.length; i++) {
    for (var j in fields) {
      var cell = sheet.getRange(startRow + i, header.indexOf(fields[j]) + 1)
      var back = cell.getBackground()
      cell.setBackground("#FFB2B2")
      var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(cell.getValue())
      .setBackground(back)
      .setRanges([cell])
      .build();
      conditionsRules.push(rule);
    }
  }
  sheet.setConditionalFormatRules(conditionsRules);
  */
  return this
}

Editor.prototype.updateTags = function () {
  var sheet = this.getPropRange('TagsStart').getSheet()
  var props = this.getProps()
  var pathHead = 'accounts/' + props.accountObject.accountId + '/containers/'
  + props.containertObject.containerId + '/workspaces/' + props.workspaceObject.workspaceId
  var startRow = this.getPropRange('TagsStart').getRow() + 2
  var column = this.header.length + 2
  Logger.log('startRow %s, column %s, sheet.getLastRow() - startRow +1 %s', startRow, column, sheet.getLastRow() - startRow +1)
  var flagsRange = sheet.getRange(startRow, column, sheet.getLastRow() - startRow +1, 1)
  var flags = flagsRange.getValues()
  Logger.log('flags %s', flags)
  var tagsData = sheet.getRange(startRow, 1, this.header.length, sheet.getLastRow()).getDisplayValues()
  var id = this.header.indexOf('tagId'), eventCategory = this.header.indexOf('eventCategory')
  var eventAction = this.header.indexOf('eventAction'),  eventLabel = this.header.indexOf('eventLabel')
  var updates = []
  for (var i = 0; i < flags.length; i++) {
    var flag = flags[i][0]
    Logger.log('flag %s && tagsData[i][id] %s', flag, tagsData[i][id])
    if (flag && tagsData[i][id]) {
      var tag = this.tags.reduce(function (tag, item) {if (item.tagId == tagsData[i][id]) tag = item; return tag}, null)
      Logger.log('tag ID %s: with eventCategory %s, eventAction %s, eventLabel %s', tagsData[i][id], tagsData[i][eventCategory], tagsData[i][eventAction], tagsData[i][eventLabel])
      var fields = ['eventCategory', 'eventAction' , 'eventLabel']
      for (var ind in tag.parameter) {
        var param = tag.parameter[ind]
        var index = fields.indexOf(param.key)
        if (index != -1) param.value = tagsData[i][this.header.indexOf(param.key)]
      }
      try {
        var response = TagManager.Accounts.Containers.Workspaces.Tags.update(tag, pathHead + '/tags/' + tag.tagId)
        updates.push([response.tagId, response.name].join(':') + ' updated')
      } catch (e) {
        Logger.log(e)
        throw e
      }
      Logger.log(updates.join('\n'))
    }
  }
  this.alert(updates.length ? updates.join('\n') : 'no tags will be ubdated')
  // clear
  flagsRange.setValue('FALSE')
}

function debug() {
  var editor = new Editor().getContainers().getWorkspaces().getTags()
  editor.getPropRange('Account').getSheet().getRange(9, 7,3,1).setValue('FALSE')
}

function listContainers() {
  var editor = new Editor()
  if (!editor.validAccount()) {
    editor.alert('Non valid Account. Please select account from dropdown')
    return
  }
  editor.containersToDropDown()
}

function listWorkSpaces() {
  var editor = new Editor()
  if (!editor.getContainers().validContainer()) {
  editor.alert('Non valid container. Please select container from dropdown')
  return
  }
  editor.workspacesToDropDown()
}

function listTags() {
  var editor = new Editor()
  editor.getContainers().getWorkspaces().getTags()
  if (editor.validAccount() && editor.validContainer() && editor.validWorkspace() ) editor.listEventTags()
}

function updateTags() {
  var editor = new Editor()
  editor.getContainers().getWorkspaces().getTags().updateTags()
}
