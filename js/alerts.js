// Prikaže sweet alert ob koncu igre (game over).
// Pokliče se iz script.js ko žogica pade na tla.
function gameOverAlert(tocke, cas) {
    Swal.fire({
        title: 'Konec igre!',
        html: 'Točke: <strong>' + tocke + '</strong><br>Čas: <strong>' + cas + '</strong>',
        icon: 'error',
        confirmButtonText: 'Poskusi znova',
        confirmButtonColor: '#3ab8d4'
    }).then(function () {
        clearInterval(intervalId);
        clearInterval(intTimer);
        predogled();
    });
}

// Prikaže sweet alert ko igralec uniči vse brike in pride do skrinjice.
function winAlert(tocke, cas) {
    Swal.fire({
        title: 'Našel si skrinjico!',
        html: '<br>Točke: <strong>' + tocke + '</strong><br>Čas: <strong>' + cas + '</strong>',
        icon: 'success',
        confirmButtonText: '🏆 Igraj znova',
        confirmButtonColor: '#3ab8d4'
    }).then(function () {
        clearInterval(intervalId);
        clearInterval(intTimer);
        predogled();
    });
}
