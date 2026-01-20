// Biến lưu trạng thái
let currentIframe = null;
let miniPlayer = null;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    miniPlayer = document.querySelector('.mini-player');
    
    // Lắng nghe click vào các music card
    const musicCards = document.querySelectorAll('.music-card');
    musicCards.forEach(card => {
        card.addEventListener('click', function() {
            const iframe = this.querySelector('iframe');
            if (iframe) {
                playInMiniPlayer(iframe);
            }
        });
    });
    
    // Nút đóng mini player
    const closeBtn = document.querySelector('.mini-player .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMiniPlayer);
    }
});

// Phát nhạc trong mini player
function playInMiniPlayer(iframe) {
    const videoSrc = iframe.src;
    const videoId = extractVideoId(videoSrc);
    
    if (!miniPlayer) return;
    
    // Tạo iframe mới với autoplay
    const miniIframe = miniPlayer.querySelector('iframe');
    if (miniIframe) {
        miniIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    // Hiển thị mini player
    miniPlayer.classList.add('active');
}

// Lấy Video ID từ URL
function extractVideoId(url) {
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
}

// Đóng mini player
function closeMiniPlayer() {
    if (!miniPlayer) return;
    
    const miniIframe = miniPlayer.querySelector('iframe');
    if (miniIframe) {
        miniIframe.src = ''; // Dừng phát
    }
    
    miniPlayer.classList.remove('active');
}
