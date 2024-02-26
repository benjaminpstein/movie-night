/*
getUsernamesList is a helper method that parses usernames list for a specific @param hangout_id from
info sent on page loading
 */
function getUsernamesList(hangout_id){
    const hangoutData = hangout_info[hangout_id][0];
    return hangoutData.usernames_list.replace(/,/g, ', ');
}

/*
getDesc parses hangout descriptions for a specific @param hangout_id from info sent on page loading
*/
function getDesc(hangout_id){
    const hangoutData = hangout_info[hangout_id][0];
    return hangoutData.hangout_desc;
}

/*
displayHangouts fills the hangouts container with the users joined hangouts
*/
function displayHangouts() {
    const yourHangoutsContainer = $("#your-hangouts-container");
    yourHangoutsContainer.empty();

    console.log(hangout_info)
    let keysArray = Object.keys(hangout_info).sort((a, b) => b - a);
    let length = keysArray.length;
    if (length === 0){
        const rowDiv = $('<div class="row"></div>');
        rowDiv.append(`
        <div id="no-hangouts">
            you aren't in any hangouts right now. make or join a hangout to get started!
        </div>
        `)
        yourHangoutsContainer.append(rowDiv);
    }

    for (let i = 0; i < length; i++) {
        const hangoutKey = keysArray[i];
        const hangoutData = hangout_info[hangoutKey][0];

        const rowDiv = $('<div class="row"></div>');
        rowDiv.append(`
        <div class="hangout-row" data-hangout-id="${hangoutData.hangout_id}">
            <div class="row">
                <div class="col-8">
                    <div class="hangout-name">
                        ${hangoutData.hangout_name}
                    </div>
                </div>
                <div class="col-2">
                    <button type="button" class="btn btn-secondary btn-sm float-end hangout-info-btn" data-action="more_info">hangout info</button>
                </div>
                <div class="col-2">
                    <button type="button" class="btn btn-primary btn-sm float-end hangout-info-btn" >enter hangout</button>
                </div>
                </div>
            </div>
        </div>
        <div id="more-info-container${hangoutData.hangout_id}"></div>
    `);
        yourHangoutsContainer.append(rowDiv);
    }
}

/*
more_info displays additional information about a selected hangout in its more info container
*/
function more_info(hangoutid, usersinhangout, hangoutDesc){
    const infoContainer = $("#more-info-container"+hangoutid);
    if (infoContainer.is(':empty')) {
        const rowDiv = $('<div class="row info-row"></div>');
        rowDiv.append(`
                <div class="col-4">
                    <div class="users-in-hangout">
                        hangout members: <br>
                        ${usersinhangout}
                    </div>
                </div>
                <div class="col-6">
                    <div class="hangout-desc">
                        hangout description: <br>
                        ${hangoutDesc}
                    </div>
                </div>
                <div class="col-2">
                    <button type="button" class="btn btn-danger btn-sm float-end leave-hangout" onclick="leaveHangout(${hangoutid})">leave hangout</button>
                </div>`);

        infoContainer.append(rowDiv);
    }else{
        infoContainer.empty();
    }
}

/*
leaveHangout POSTs the @param hangout_id of the hangout a user wants to leave to the server
*/
function leaveHangout(hangout_id){
    console.log(hangout_id)
    let leaveData = {'hangout_id': hangout_id}
    $.ajax({
        type: "POST",
        url: "/leave-hangout",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(leaveData),
        success: function (result) {
            $("#more-info-container"+hangout_id).empty()
            hangout_info = result.hangout_info;
            displayHangouts();
            hangoutRowListener();
            flashMessage("left hangout. bye bye!", "primary")
        },
        error: function (request, status, error) {
            console.log("Error");
            console.log(request);
            console.log(status);
            console.log(error);
        }
    });
}

/*
hangoutRowClick is a function that controls buttons for the clickable hangout rows, calling more_info on
a user clicking the more info button and redirecting to the hangout page for anywhere else
*/
function hangoutRowClick(event) {
    const target = $(event.target);
    const hangoutId = $(this).data('hangout-id');
    const usersInHangout = getUsernamesList(hangoutId);
    const hangoutDesc = getDesc(hangoutId)

    if (target.is('button')) {
        const action = target.data('action');
        if (action === 'more_info') {
            more_info(hangoutId, usersInHangout, hangoutDesc);
        } else {
            window.location.href = `/hangout/${hangoutId}`;
        }
    }else{
        window.location.href = `/hangout/${hangoutId}`;
    }
}

/*
hangoutRowListener listens for clicks on the hangout row and calls the control function hangoutRowClick on a click
 */
function hangoutRowListener(){
    $('.hangout-row').on('click', function (event) {
        hangoutRowClick.call(this, event);
    });
}

$(document).ready(function () {

    displayHangouts();
    hangoutRowListener();

});