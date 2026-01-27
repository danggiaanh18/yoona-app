// ========== GLOBAL STATE ==========
let currentPlayer = null;
let isPlaying = false;
let currentSongIndex = 0;
let playlist = [];

// ========== INDEX PAGE - Voice Quote ==========
if (window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/api/quotes');
            const quotes = await response.json();
            
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            document.querySelector('.quote-text').textContent = randomQuote.text;
            
            document.querySelector('.enter-btn').addEventListener('click', () => {
                window.location.href = '/home';
            });
        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    });
}

// ========== HOME PAGE ==========
if (window.location.pathname === '/home') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Load movies
        try {
            const response = await fetch('/api/movies');
            const movies = await response.json();
            
            const movieGrid = document.querySelector('.movie-grid');
            
            movies.forEach(movie => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.innerHTML = `
                    <img src="${movie.cover}" alt="${movie.title}" class="movie-cover">
                    <div class="movie-info">
                        <div class="movie-title">${movie.title}</div>
                        <div class="movie-meta">
                            <span>📅 ${movie.year}</span>
                            <span>🎭 ${movie.role}</span>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    window.location.href = `/movie/${movie.id}`;
                });
                movieGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading movies:', error);
        }
        
        // Khởi tạo cả 2 player
        await initAudioPlayer();
        initVideoPlayer();
        
        // Auto play nhạc nền sau 2 giây
        setTimeout(playBackgroundMusic, 2000);
    });
}

// ========== AUDIO PLAYER (YOUTUBE IFRAME ẨN) ==========
async function initAudioPlayer() {
    try {
        const response = await fetch('/api/songs');
        playlist = await response.json();
        
        const audioPlayer = document.querySelector('.audio-mini-player');
        const playBtn = document.querySelector('.audio-mini-player .player-btn.play');
        const prevBtn = document.querySelector('.audio-mini-player .player-btn.prev');
        const nextBtn = document.querySelector('.audio-mini-player .player-btn.next');
        const closeBtn = document.querySelector('.audio-mini-player .player-btn.close');
        
        if (!audioPlayer) {
            console.log('Audio player not found');
            return;
        }
        
        console.log('✅ Audio player initialized with', playlist.length, 'songs');
        
        // Play/Pause button
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (!currentPlayer) {
                    // Nếu chưa có player, load bài đầu tiên
                    loadSong(0);
                    return;
                }
                
                if (isPlaying) {
                    pauseSong();
                    playBtn.textContent = '▶️';
                } else {
                    resumeSong();
                    playBtn.textContent = '⏸️';
                }
                isPlaying = !isPlaying;
            });
        }
        
        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
                loadSong(currentSongIndex);
            });
        }
        
        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentSongIndex = (currentSongIndex + 1) % playlist.length;
                loadSong(currentSongIndex);
            });
        }
        
        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                stopSong();
                audioPlayer.classList.remove('active');
                isPlaying = false;
                if (playBtn) playBtn.textContent = '▶️';
            });
        }
        
    } catch (error) {
        console.error('❌ Error initializing audio player:', error);
    }
}

function loadSong(index) {
    if (!playlist[index]) {
        console.error('❌ Song not found at index:', index);
        return;
    }
    
    const song = playlist[index];
    const audioPlayer = document.querySelector('.audio-mini-player');
    const playBtn = document.querySelector('.audio-mini-player .player-btn.play');
    const titleEl = document.querySelector('.player-title');
    const artistEl = document.querySelector('.player-artist');
    const albumCover = document.querySelector('.album-cover');
    
    console.log('🎵 Loading song:', song.title);
    
    // Update UI
    if (titleEl) titleEl.textContent = song.title;
    if (artistEl) artistEl.textContent = song.artist;
    if (albumCover && song.cover) albumCover.src = song.cover;
    
    // Stop current player
    stopSong();
    
    // Create YouTube iframe (ẩn)
    if (song.youtube_id) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `https://www.youtube.com/embed/${song.youtube_id}?autoplay=1&enablejsapi=1&loop=1&playlist=${song.youtube_id}`;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.id = 'youtube-audio-player';
        document.body.appendChild(iframe);
        
        currentPlayer = iframe;
        isPlaying = true;
        
        if (playBtn) playBtn.textContent = '⏸️';
        if (audioPlayer) audioPlayer.classList.add('active');
        
        console.log('✅ Playing from YouTube:', song.youtube_id);
        
        // Giả lập progress bar
        startFakeProgress(song.duration || 240);
        
    } else {
        console.error('❌ No YouTube ID found for:', song.title);
    }
}

function pauseSong() {
    if (currentPlayer && currentPlayer.tagName === 'IFRAME') {
        // Pause YouTube video bằng cách reload iframe không autoplay
        const song = playlist[currentSongIndex];
        currentPlayer.src = `https://www.youtube.com/embed/${song.youtube_id}?enablejsapi=1`;
        console.log('⏸️ Paused');
    }
}

function resumeSong() {
    if (currentPlayer && currentPlayer.tagName === 'IFRAME') {
        // Resume bằng cách reload với autoplay
        const song = playlist[currentSongIndex];
        currentPlayer.src = `https://www.youtube.com/embed/${song.youtube_id}?autoplay=1&enablejsapi=1&loop=1&playlist=${song.youtube_id}`;
        console.log('▶️ Resumed');
    }
}

function stopSong() {
    if (currentPlayer) {
        if (currentPlayer.tagName === 'IFRAME') {
            currentPlayer.remove();
        }
        currentPlayer = null;
    }
    clearInterval(window.fakeProgressInterval);
    isPlaying = false;
}

// Giả lập progress bar (vì YouTube API phức tạp)
function startFakeProgress(duration = 240) {
    clearInterval(window.fakeProgressInterval);
    
    let currentTime = 0;
    
    const progressFill = document.querySelector('.progress-fill');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    
    if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
    
    window.fakeProgressInterval = setInterval(() => {
        if (!isPlaying) return;
        
        currentTime += 1;
        
        if (currentTime >= duration) {
            clearInterval(window.fakeProgressInterval);
            // Auto next song
            currentSongIndex = (currentSongIndex + 1) % playlist.length;
            loadSong(currentSongIndex);
            return;
        }
        
        const percent = (currentTime / duration) * 100;
        if (progressFill) progressFill.style.width = percent + '%';
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
        
    }, 1000);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function playBackgroundMusic() {
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();
        
        // Tìm bài có type = "background" hoặc lấy bài đầu tiên
        const bgSong = songs.find(s => s.type === 'background') || songs[0];
        
        if (bgSong) {
            currentSongIndex = songs.findIndex(s => s.id === bgSong.id);
            console.log('🎶 Auto-playing background music:', bgSong.title);
            loadSong(currentSongIndex);
        }
    } catch (error) {
        console.error('❌ Error loading background music:', error);
    }
}

// ========== VIDEO PLAYER (YOUTUBE MINI PLAYER) ==========
function initVideoPlayer() {
    const videoPlayer = document.querySelector('.video-mini-player');
    const closeBtn = document.querySelector('.video-mini-player .close-btn');
    const musicCards = document.querySelectorAll('.music-card');
    
    if (!videoPlayer) {
        console.log('Video player not found');
        return;
    }
    
    console.log('✅ Video player initialized! Found', musicCards.length, 'music cards');
    
    musicCards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            // Nếu click vào iframe thì không làm gì
            if (e.target.tagName === 'IFRAME') return;
            
            const videoId = this.getAttribute('data-video-id');
            if (videoId) {
                console.log('🎬 Playing video:', videoId);
                playVideoInMiniPlayer(videoId, this);
            }
        });
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoPlayer);
    }
}

function playVideoInMiniPlayer(videoId, card) {
    const videoPlayer = document.querySelector('.video-mini-player');
    const miniIframe = videoPlayer.querySelector('iframe');
    
    if (!videoPlayer || !miniIframe) {
        console.error('❌ Video player elements not found');
        return;
    }
    
    console.log('▶️ Playing video ID:', videoId);
    
    miniIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    videoPlayer.classList.add('active');
    
    // Highlight card đang phát
    document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
    card.classList.add('playing');
}

function closeVideoPlayer() {
    const videoPlayer = document.querySelector('.video-mini-player');
    const miniIframe = videoPlayer.querySelector('iframe');
    
    if (!videoPlayer) return;
    
    console.log('❌ Closing video player');
    
    if (miniIframe) {
        miniIframe.src = '';
    }
    
    videoPlayer.classList.remove('active');
    document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
}

// ========== MOVIE DETAIL PAGE ==========
if (window.location.pathname.startsWith('/movie/')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const movieId = parseInt(window.location.pathname.split('/')[2]);
        
        try {
            const response = await fetch(`/api/movie/${movieId}`);
            const movie = await response.json();
            
            document.querySelector('.movie-header-content h1').textContent = movie.title;
            document.querySelector('.movie-header-bg').src = movie.cover;
            
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.tab;
                    
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.add('active');
                    document.getElementById(target).classList.add('active');
                });
            });
            
            if (movie.images) {
                const gallery = document.querySelector('.image-gallery');
                movie.images.forEach(img => {
                    const imgEl = document.createElement('img');
                    imgEl.src = img;
                    imgEl.className = 'gallery-img';
                    gallery.appendChild(imgEl);
                });
            }
            
            if (movie.memories) {
                const memoriesContainer = document.getElementById('memories');
                movie.memories.forEach(mem => {
                    const memEl = document.createElement('div');
                    memEl.className = 'memory-item';
                    memEl.innerHTML = `
                        <div class="memory-date">${mem.date}</div>
                        <div class="memory-text">${mem.text}</div>
                    `;
                    memoriesContainer.appendChild(memEl);
                });
            }
            
        } catch (error) {
            console.error('Error loading movie:', error);
        }
    });
}

// ========== TIMELINE PAGE ==========
if (window.location.pathname === '/timeline') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/api/timeline');
            const timeline = await response.json();
            
            const container = document.querySelector('.timeline-container');
            
            Object.keys(timeline).sort((a, b) => b - a).forEach(year => {
                const yearSection = document.createElement('div');
                yearSection.className = 'timeline-year';
                yearSection.innerHTML = `<div class="year-label">${year}</div>`;
                
                timeline[year].forEach(event => {
                    const eventEl = document.createElement('div');
                    eventEl.className = 'timeline-event';
                    eventEl.innerHTML = `
                        <div class="event-date">${event.date}</div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-desc">${event.description}</div>
                    `;
                    yearSection.appendChild(eventEl);
                });
                
                container.appendChild(yearSection);
            });
        } catch (error) {
            console.error('Error loading timeline:', error);
        }
    });
}
// ========== PWA SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('✅ Service Worker đã đăng ký thành công!', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker đăng ký thất bại:', error);
            });
    });
}

// ========== PWA INSTALL PROMPT ==========
let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.id = 'install-btn';
installBtn.innerHTML = '📱 Cài đặt App';
installBtn.style.cssText = `
    display: none;
    position: fixed;
    bottom: 90px;
    right: 20px;
    padding: 15px 30px;
    background: linear-gradient(135deg, #6BCF7F, #4A9B6F);
    color: white;
    border: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 5px 20px rgba(107, 207, 127, 0.4);
    z-index: 998;
    cursor: pointer;
    transition: all 0.3s ease;
`;

document.body.appendChild(installBtn);

// Lắng nghe sự kiện cài đặt PWA
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎉 PWA có thể cài đặt!');
    e.preventDefault();
    deferredPrompt = e;
    
    // Hiển thị nút cài đặt
    installBtn.style.display = 'block';
    
    // Hiệu ứng hover
    installBtn.addEventListener('mouseenter', () => {
        installBtn.style.transform = 'scale(1.05)';
        installBtn.style.boxShadow = '0 8px 25px rgba(107, 207, 127, 0.6)';
    });
    
    installBtn.addEventListener('mouseleave', () => {
        installBtn.style.transform = 'scale(1)';
        installBtn.style.boxShadow = '0 5px 20px rgba(107, 207, 127, 0.4)';
    });
});

// Xử lý click nút cài đặt
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        console.log('❌ Không có prompt để cài đặt');
        return;
    }
    
    // Hiển thị prompt cài đặt
    deferredPrompt.prompt();
    
    // Đợi người dùng chọn
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('✅ Người dùng đã cài đặt PWA');
        installBtn.style.display = 'none';
    } else {
        console.log('❌ Người dùng từ chối cài đặt');
    }
    
    deferredPrompt = null;
});

// Ẩn nút khi đã cài đặt
window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA đã được cài đặt!');
    installBtn.style.display = 'none';
    deferredPrompt = null;
});

// Kiểm tra nếu đang chạy như PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ Đang chạy như PWA standalone');
    installBtn.style.display = 'none';
}
// ========== FANMEETING PAGE ==========
if (window.location.pathname === '/fanmeeting') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/api/fanmeetings');
            const fanmeetings = await response.json();
            
            const grid = document.querySelector('.fanmeeting-grid');
            const filterBtns = document.querySelectorAll('.filter-btn');
            
            // Calculate stats
            const totalEvents = fanmeetings.length;
            const uniqueCities = new Set(fanmeetings.map(fm => fm.location)).size;
            const totalFans = fanmeetings.reduce((sum, fm) => {
                const num = parseInt(fm.attendees.replace(/,/g, ''));
                return sum + (isNaN(num) ? 0 : num);
            }, 0);
            
            // Update stats if elements exist
            const totalEventsEl = document.getElementById('totalEvents');
            const totalCitiesEl = document.getElementById('totalCities');
            const totalFansEl = document.getElementById('totalFans');
            
            if (totalEventsEl) totalEventsEl.textContent = totalEvents;
            if (totalCitiesEl) totalCitiesEl.textContent = uniqueCities;
            if (totalFansEl) totalFansEl.textContent = totalFans.toLocaleString();
            
            // Render fanmeeting cards
            function renderFanmeetings(filter = 'all') {
                grid.innerHTML = '';
                
                let filtered = fanmeetings;
                
                // Filter by type (solo, group, drama) or country
                if (filter !== 'all') {
                    if (['solo', 'group', 'drama'].includes(filter)) {
                        filtered = fanmeetings.filter(fm => fm.type === filter);
                    } else {
                        filtered = fanmeetings.filter(fm => fm.country === filter);
                    }
                }
                
                // Sort by date (newest first)
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                filtered.forEach(fm => {
                    const card = document.createElement('div');
                    card.className = 'fanmeeting-card';
                    
                    // Type badge
                    const typeEmoji = {
                        'solo': '👤 Solo',
                        'group': '👥 SNSD',
                        'drama': '🎭 Drama'
                    };
                    
                    card.innerHTML = `
                        <img src="${fm.cover}" alt="${fm.title}" class="fanmeeting-cover" 
                             onerror="this.src='https://via.placeholder.com/300x200/6BCF7F/ffffff?text=Yoona+FM'">
                        <div class="fanmeeting-info">
                            <span class="fanmeeting-type">${typeEmoji[fm.type] || fm.type}</span>
                            <div class="fanmeeting-title">${fm.title}</div>
                            <div class="fanmeeting-meta">
                                <div class="fanmeeting-location">
                                    📍 ${fm.location}
                                </div>
                                <div class="fanmeeting-date">
                                    📅 ${new Date(fm.date).toLocaleDateString('vi-VN')}
                                </div>
                                <div style="color: #6BCF7F; font-weight: 600;">
                                    👥 ${fm.attendees} người
                                </div>
                            </div>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => openFanmeetingModal(fm));
                    grid.appendChild(card);
                });
                
                // Show message if no results
                if (filtered.length === 0) {
                    grid.innerHTML = '<p style="text-align:center; color:#999; grid-column: 1/-1;">Không có fanmeeting nào</p>';
                }
            }
            
            // Filter buttons
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderFanmeetings(btn.dataset.filter);
                });
            });
            
            // Initial render
            renderFanmeetings();
            
        } catch (error) {
            console.error('Error loading fanmeetings:', error);
            document.querySelector('.fanmeeting-grid').innerHTML = 
                '<p style="text-align:center; color:#999;">Không thể tải dữ liệu fanmeeting</p>';
        }
    });
}

// Open fanmeeting modal
function openFanmeetingModal(fm) {
    const modal = document.getElementById('fanmeetingModal');
    const modalBody = modal.querySelector('.modal-body');
    
    const typeEmoji = {
        'solo': '👤 Solo Tour',
        'group': '👥 SNSD Group',
        'drama': '🎭 Drama Fanmeeting'
    };
    
    modalBody.innerHTML = `
        <img src="${fm.cover}" alt="${fm.title}" class="modal-header-img" 
             onerror="this.src='https://via.placeholder.com/800x300/6BCF7F/ffffff?text=Yoona+Fanmeeting'">
        <h2 class="modal-title">${fm.title}</h2>
        
        <div class="modal-details">
            <div class="modal-detail-item">
                🎪 <strong>Loại:</strong> ${typeEmoji[fm.type] || fm.type}
            </div>
            <div class="modal-detail-item">
                📅 <strong>Ngày:</strong> ${new Date(fm.date).toLocaleDateString('vi-VN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </div>
            <div class="modal-detail-item">
                📍 <strong>Địa điểm:</strong> ${fm.location}
            </div>
            <div class="modal-detail-item">
                👥 <strong>Số lượng fan:</strong> ${fm.attendees} người
            </div>
        </div>
        
        <div class="modal-description">
            ${fm.description}
        </div>
        
        ${fm.images && fm.images.length > 0 ? `
            <h3 style="margin-bottom: 1rem;">📸 Hình ảnh</h3>
            <div class="modal-gallery">
                ${fm.images.map(img => `<img src="${img}" alt="Fanmeeting">`).join('')}
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
}

// Close modal
document.addEventListener('click', (e) => {
    const modal = document.getElementById('fanmeetingModal');
    if (e.target.classList.contains('close-modal') || e.target === modal) {
        modal.classList.remove('active');
    }
});
