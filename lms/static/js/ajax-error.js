$(document).ajaxError(function(event, jXHR) {
    if (jXHR.status === 403 && jXHR.responseText === 'Unauthenticated') {
        // var message = gettext(
        //     'You have been logged out of your account. ' +
        //     'Click Okay to log in again now. ' +
        //     'Click Cancel to stay on this page ' +
        //     '(you must log in again to save your work).'
        // );
        var message = "Sie wurden aus Ihrem close2real-Konto ausgeloggt. Klicken Sie bitte auf 'OK', um sich erneut anzumelden. Klicken Sie auf 'Abbrechen', um weiterhin auf der Seite zu bleiben. Achtung: Um mit dem Kurs fortzufahren und Ihre bisherigen Ergebnisse zu speichern, müssen Sie sich hier erneut anmelden";

        if (window.confirm(message)) {
            var currentLocation = window.location.pathname;
            window.location.href = '/login?next=' + encodeURIComponent(currentLocation);
        }
    }
});
