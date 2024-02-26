/*
flashMessage displays info messages below the nav bar for 3 seconds
@param message is message to be displayed, @param category determines color of flash box
category 'primary' is blue, category 'danger' is red
*/
function flashMessage(message, category) {
        let flashContainer = $('#flash-message-container');

        let alertElement = $('<div class="alert alert-' + category + ' alert-dismissible fade show" role="alert">' +
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
            '</div>');

        flashContainer.empty().append(alertElement);

        flashContainer.show();

        setTimeout(function () {
            alertElement.alert('close');
            alertElement.remove();
        }, 3000);
}

/*
flashMessageLong displays info messages below the nav bar for 10 seconds
@param message is message to be displayed, @param category determines color of flash box
category 'primary' is blue, category 'danger' is red
*/
function flashMessageLong(message, category) {
        let flashContainer = $('#flash-message-container');

        let alertElement = $('<div class="alert alert-' + category + ' alert-dismissible fade show" role="alert">' +
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
            '</div>');

        flashContainer.empty().append(alertElement);

        flashContainer.show();

        setTimeout(function () {
            alertElement.alert('close');
            alertElement.remove();
        }, 10000);
}