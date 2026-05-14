const images = document.querySelectorAll('.crowd img');

images.forEach((img, i) => {
	img.style.left = `${(i * 10)}px`;//nastavi zamik v levo vsaki sliki
	img.style.animationDelay = `${Math.random() * 1}s`;//deleja animacijo za vsako sliko razlicno
});

const leftImages = document.querySelectorAll('.crowd-left img');
leftImages.forEach((img, i) => {
    img.style.left = `${(i * 5)}px`;
    img.style.animationDelay = `${Math.random() * 1}s`;
});

const rightImages = document.querySelectorAll('.crowd-right img');
rightImages.forEach((img, i) => {
    img.style.left = `${(i * 5)}px`;
    img.style.animationDelay = `${Math.random() * 1}s`;
});