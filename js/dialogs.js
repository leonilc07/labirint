function showCredits() {
    Swal.fire({
        title: '<span style="font-family:Orbitron,sans-serif;color:#3CB043">Credits</span>',
        html: `
          <div style="text-align:center;font-family:Share Tech Mono,monospace;color:#ccc;line-height:2">
            <p style="font-size:1.1rem;color:#fff;margin-bottom:4px"><b>Leon Ilc</b></p>
            <p style="color:#7ecf82;letter-spacing:1px;font-size:0.85rem">4RA</p>
            <p style="color:#aaa;letter-spacing:1px;font-size:0.85rem">3. projektna naloga</p>
          </div>
        `,
        background: '#0d0d18',
        color: '#ccc',
        confirmButtonText: 'Zapri',
        confirmButtonColor: '#3CB043',
        width: '360px',
        customClass: { popup: 'swal-game-popup' }
    });
}

function showNavodila() {
    Swal.fire({
        title: '<span style="font-family:Orbitron,sans-serif;color:#3CB043">Kako igrati?</span>',
        html: `
          <div style="text-align:left;font-family:Share Tech Mono,monospace;color:#ccc;line-height:1.8">
            <p style="margin-bottom:10px;color:#7ecf82;letter-spacing:1px;text-transform:uppercase;font-size:0.75rem">Cilj igre</p>
            <p>Pripelji miško skozi labirint v najhitrejšem možnem času!</p>
            <hr style="border-color:#3CB04333;margin:12px 0">
            <p style="margin-bottom:10px;color:#7ecf82;letter-spacing:1px;text-transform:uppercase;font-size:0.75rem">Upravljanje</p>
            <p>&#8593; &#8595; &#8592; &#8594; &nbsp;&nbsp; ali &nbsp;&nbsp; W A S D</p>
            <p style="font-size:0.85rem;color:#888;margin-top:4px">Dve tipki hkrati = diagonalno gibanje</p>
            <hr style="border-color:#3CB04333;margin:12px 0">
            <p style="margin-bottom:10px;color:#7ecf82;letter-spacing:1px;text-transform:uppercase;font-size:0.75rem">Nastavitve</p>
            <p>&#128260; <b style="color:#fff">Velikost</b> &mdash; nastavi velikost miške</p>
            <p>&#9889; <b style="color:#fff">Hitrost</b> &mdash; nastavi hitrost miške</p>
            <p style="font-size:0.85rem;color:#888;margin-top:4px">Ko začneš se nastavitve zaključijo!</p>
            <hr style="border-color:#3CB04333;margin:12px 0">
            <p style="margin-bottom:10px;color:#7ecf82;letter-spacing:1px;text-transform:uppercase;font-size:0.75rem">Gumbi</p>
            <p>&#9654; <b style="color:#e74c3c">Pokaži</b> &mdash; razkrije rešitev labirinta</p>
            <p>&#8635; <b style="color:#2e86c1">Reset</b> &mdash; začni znova</p>
            <hr style="border-color:#3CB04333;margin:12px 0">
            <p style="color:#FFD700;font-size:0.85rem">&#127942; Doseži kar najboljši čas in zasedaj vrh lestvice!</p>
          </div>
        `,
        background: '#0d0d18',
        color: '#ccc',
        confirmButtonText: 'Igraj!',
        confirmButtonColor: '#3CB043',
        width: '480px',
        customClass: { popup: 'swal-game-popup' }
    });
}
