function playZoomAnimation() {
    document.body.classList.add('zoom-out');

    setTimeout(() => {
        window.location.href = 'html/map.html';
    }, 800)
}
