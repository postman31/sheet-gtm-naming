# Bulk Update GA event GTM tags in Google sheet
This tool provide a possibility to review and update event categories, actions and labels in GTM with a help of Google Sheet.
1. Before you start.
  To start using this tool follow these steps:
  1. Copy the original spreadsheet [link](https://docs.google.com/spreadsheets/d/12bNHxb8sTJhg5jNMqZqS0GQx_ywQG2rHvuOHTes_gXI/copy)
  2. Go to *Tools > Script editor*
  3. Within script editor window go to *Resources > Advanced Google Services*
  4. Scroll to the Tag Manager API and check if it's enabled
  5. Click the link to the  *Google Cloud Platform API Dashboard* below the list and enable Tag Manager API
  6. Click 'Reset' button on the original sheet to fetch your GTM accounts
2. Usage
  To get the tags list you'll need first select account, container and workspace. Do this step by step. First, select the account and click 'Get Containers'. Then select the container and click 'Get Workspace'. And finally, select the workspace and click 'Get Tags'. This will populate the list of available Google Analytics event tags.
  Now you can edit the values for event categories, actions and labels in the sheet. To update the values, check the corresponding rows in the 'update' column and click **'Update tags'**
  Please note that this script do not publish your updated container. You have to do that by yourself via GTM.

  The short example of use is available at [youtube](https://youtu.be/N4j5eQVI-io)
