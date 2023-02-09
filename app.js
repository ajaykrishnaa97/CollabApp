var client;
init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);
}

async function renderText() {
  console.log("App rendered");
  var ids = [];
  var names = [];
  var userId = await getListOfUsersWithAccess(ids);
  var agentNames = await getAgentNames(userId, names);
  console.log(agentNames);
  if (typeof agentNames != "undefined") {
    const tableEl = document.querySelector("table");

    for (let j = document.getElementById("tbl").rows.length - 1; j < agentNames.length; j++) {
      var row = `<tr>
         <td class="agntName">${agentNames[j]}</td>
         <td><button class="deleteBtn">Delete</button></td>
       </tr>`
      tableEl.innerHTML += row;
    }

    async function onDeleteRow(e) {
      if (!e.target.classList.contains("deleteBtn")) {
        return;
      }
      const btn = e.target;
      var rowtobeDeleted = (btn.closest("tr").rowIndex);
      await DeleteRow(rowtobeDeleted - 1, userId, btn);
    }
    tableEl.addEventListener("click", onDeleteRow);

      async function DeleteRow(rowtobeDeleted, userId, btn) {
        console.log(`preparing to delete ${agentNames[rowtobeDeleted]}`);


        var count = userId[rowtobeDeleted];
        if (typeof count != "undefined") {
          client.data.get("ticket").then(async (ticketDetail) => {
            client.data.get("domainName").then(async (domainDetail) => {
              const removeaccessURL = `https://${domainDetail.domainName}/api/v2/tickets/${ticketDetail.ticket.id}/accesses`;
              params = {
                "user_ids": [
                  {
                    "id": count,
                    "deleted": true
                  }]
              }
              const dltOptions = {
                headers: {
                  'Content-Type': 'application/json',
                  "Authorization": "Basic <%= encode(iparam.apiKey) %>"
                },
                body: JSON.stringify(params)

              };

              await client.request.patch(removeaccessURL, dltOptions)
                .then(
                  function () {
                    console.log(`${agentNames[rowtobeDeleted]} is deleted`);
                    agentNames.splice(rowtobeDeleted, 1);
                    userId.splice(rowtobeDeleted, 1);
                    btn.closest("tr").remove();

                    client.interface.trigger("showNotify", {
                      type: "success", title: "Success",
                      message: "The user is deleted"

                    });

                  },
                  function (error) {
                    client.interface.trigger("showNotify", {
                      type: "warning", title: "Failure",
                      message: `${error}`
                    });
                    console.log(error);
                  }
                );
            }, error => {
              console.error('Error: Failed to get ticket details with Data method.');
              console.error(error);

            });
          }, error => {
            console.error('Error: Failed to get domain details with Data method.');
            console.error(error);
          });
        }

      }


  }
}

async function getListOfUsersWithAccess(ids) {
  await client.data.get("ticket").then(async (ticketDetail) => {
    await client.data.get("domainName").then(async (domainDetail) => {
      const getIdsUrl = `https://${domainDetail.domainName}/api/v2/tickets/${ticketDetail.ticket.id}/accesses`;
      const options = {
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Basic <%= encode(iparam.apiKey) %>"
        }
      };
      await client.request.get(getIdsUrl, options)
        .then(
          function (data) {
            var getResponse = JSON.parse(data.response);
            ids = getResponse.user_ids;

          },
          function (error) {
            client.interface.trigger("showNotify", {
              type: "warning", title: "Failure",
              message: `${error}`
            });
            console.log(error);

          });
    }, error => {
      console.error('Error: Failed to get ticket details with Data method.');
      console.error(error);

    });
  }, error => {
    console.error('Error: Failed to get domain details with Data method.');
    console.error(error);
  });

  return ids;

}

async function getAgentNames(userId, names) {
  await client.data.get("ticket").then(async () => {
    await client.data.get("domainName").then(async (domainDetail) => {
      const options = {
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Basic <%= encode(iparam.apiKey) %>"
        }
      };
      for (let i = 0; i < userId.length; i++) {
        var getagenNamesURL = `https://${domainDetail.domainName}/api/v2/agents/${userId[i]}`;
        await client.request.get(getagenNamesURL, options)
          .then(
            function (data) {
              var getResponse = JSON.parse(data.response);
              names.push(getResponse.contact.name);

            },
            function (error) {
              console.log(error);
            });
      }
    }, error => {
      console.error('Error: Failed to get ticket details with Data method.');
      console.error(error);

    });
  }, error => {
    console.error('Error: Failed to get domain details with Data method.');
    console.error(error);
  });
  return names;

}
