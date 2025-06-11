/**
 * Публичный просмотр панорам
 */
class PublicViewApp {
    constructor() {
        this.userData = null;
        this.userId = this.getUserIdFromUrl() || 1; // По умолчанию ID 1, если не указано
        this.orgId = this.getOrgIdFromUrl(); // ID организации из URL
        this.currentOrgIndex = 0; // Индекс организации в массиве (устанавливается после загрузки данных)
        this.currentFloorIndex = 0;
        this.currentRoomIndex = 0;
        this.panoramaLoaded = false;
        this.hasAuthToken = this.checkAuthToken(); // Проверяем наличие токена авторизации
        
        this.init();
    }

    /**
     * Проверяет наличие токена авторизации в localStorage
     * @returns {boolean} - true, если токен есть
     */
    checkAuthToken() {
        return !!localStorage.getItem('jwt');
    }

    /**
     * Получает ID пользователя из URL параметра
     * @returns {number|null} - ID пользователя или null
     */
    getUserIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        return userId ? parseInt(userId) : null;
    }

    /**
     * Получает ID организации из URL параметра
     * @returns {number|null} - ID организации или null
     */
    getOrgIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get('orgId');
        return orgId ? parseInt(orgId) : null;
    }

    /**
     * Инициализирует приложение
     */
    init() {
        this.publicContent = document.getElementById('public-content');
        this.loadingMessage = document.querySelector('.loading-message');
        this.baseUrl = 'http://localhost:1337/api';
        
        this.loadData();
    }

    /**
     * Загружает данные пользователя и организаций напрямую через fetch
     */
    async loadData() {
        try {
            // Запрос напрямую через fetch вместо apiService.getPublicUserData
            const response = await fetch(
                `${this.baseUrl}/users/${this.userId}?populate[Org][populate][Floor][populate][ImageMap]=*&populate[Org][populate][Floor][populate][Room][populate][ImageRoom]=*&populate[Org][populate][Floor][populate][audioFile]=*&populate[Org][populate][Floor][populate][Room][populate][audioFile]=*`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Ошибка получения публичных данных');
            }

            this.userData = await response.json();
            console.log('Загружены данные:', this.userData);
            
            if (!this.userData || !this.userData.Org || this.userData.Org.length === 0) {
                this.showErrorMessage('У этого пользователя нет доступных организаций для просмотра');
                return;
            }
            
            // Находим индекс указанной организации если задан orgId
            if (this.orgId) {
                const foundIndex = this.userData.Org.findIndex(org => org.id === this.orgId);
                if (foundIndex !== -1) {
                    this.currentOrgIndex = foundIndex;
                } else {
                    console.warn(`Организация с ID ${this.orgId} не найдена, используется первая доступная организация`);
                }
            }
            
            this.hideLoadingMessage();
            this.renderContent();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorMessage('Ошибка загрузки данных. Пожалуйста, попробуйте позже.');
        }
    }

    /**
     * Скрывает сообщение о загрузке
     */
    hideLoadingMessage() {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.classList.add('d-none');
        }
        
        // Показываем основной контент
        this.publicContent.classList.remove('d-none');
    }

    /**
     * Показывает сообщение об ошибке
     */
    showErrorMessage(message) {
        // Скрываем сообщение о загрузке
        this.hideLoadingMessage();
        
        // Показываем сообщение об ошибке вместо контента
        this.publicContent.innerHTML = `
            <div class="container main-content py-5 text-center">
                <div class="main-card mx-auto" style="max-width: 500px;">
                    <div class="main-card-header">
                        <h5 class="mb-0">Ошибка</h5>
                    </div>
                    <div class="main-card-body text-center">
                        <i class="bi bi-exclamation-triangle-fill text-danger display-4 mb-3"></i>
                        <p class="mb-4">${message}</p>
                        <button class="main-btn" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Обновить страницу
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Показываем контент
        this.publicContent.classList.remove('d-none');
    }

    /**
     * Отображает основной контент
     */
    renderContent() {
        const org = this.userData.Org[this.currentOrgIndex];
        const floor = org.Floor && org.Floor.length > 0 ? 
            org.Floor[this.currentFloorIndex] : null;
        
        this.publicContent.innerHTML = `
            <div class="container-fluid p-0">
                <!-- Панорама комнаты (на весь экран) -->
                <div id="public-panorama" class="public-panorama-container">
                    <!-- Здесь будет отображаться панорама -->
                </div>
                
                <!-- Боковая панель управления (поверх панорамы) -->
                <div class="position-fixed top-0 start-0 h-100 sidebar-panel p-3" style="width: 300px; z-index: 1000; overflow-y: auto; overflow-x: visible;">
                    <h4 class="org-title mb-4 text-center" style="color: #333; background: linear-gradient(135deg, #6e8efb, #a777e3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; letter-spacing: 0.5px;">
                        <i class="bi bi-building me-2"></i>${org.Title}
                    </h4>
                    
                    ${this.hasAuthToken ? `
                    <!-- Кнопка На главную (если пользователь авторизован) -->
                    <a href="index.html" class="main-btn main-btn-outline w-100 mb-4" style="text-decoration: none;">
                        <i class="bi bi-house-door me-2"></i>На главную
                    </a>
                    ` : ''}
                    
                    <!-- Выбор этажа -->
                    <div class="main-card mb-3">
                        <div class="main-card-header">
                            <i class="bi bi-layers me-2"></i>
                            <h5 class="mb-0">Этажи</h5>
                        </div>
                        <div class="main-card-body">
                            <div class="d-flex flex-wrap gap-2">
                                ${org.Floor ? org.Floor.map((floor, index) => 
                                    `<button class="${index === this.currentFloorIndex ? 'main-btn' : 'main-btn main-btn-outline'} public-floor-btn" 
                                        data-floor-index="${index}">
                                        <i class="bi bi-stack me-2"></i>${floor.Title}
                                    </button>`
                                ).join('') : '<p class="text-muted">Нет доступных этажей</p>'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Список комнат -->
                    <div class="main-card mb-3">
                        <div class="main-card-header">
                            <i class="bi bi-door-open me-2"></i>
                            <h5 class="mb-0">Комнаты</h5>
                        </div>
                        <div class="main-card-body">
                            <div class="d-flex flex-wrap gap-2">
                                ${floor && floor.Room && floor.Room.length > 0 ? 
                                    floor.Room.map((room, index) => 
                                        `<button class="${index === this.currentRoomIndex ? 'main-btn' : 'main-btn main-btn-outline'} public-room-btn" 
                                            data-room-index="${index}">
                                            <i class="bi bi-door-closed me-2"></i>${room.Title}
                                        </button>`
                                    ).join('') 
                                    : '<p class="text-muted">Нет доступных комнат</p>'
                                }
                            </div>
                        </div>
                    </div>
                    
                    <!-- Текущее местоположение -->
                    ${floor && floor.Room && floor.Room.length > 0 ? 
                        `<div class="main-card">
                            <div class="main-card-body">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-geo-alt-fill me-2" style="color: #6e8efb;"></i>
                                    <div>
                                        <div><strong>Этаж:</strong> ${floor.Title}</div>
                                        <div><strong>Комната:</strong> ${floor.Room[this.currentRoomIndex]?.Title || 'Не выбрана'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>` 
                    : ''}
                    
                    <!-- Дополнительный отступ, чтобы контент не перекрывался кнопкой -->
                    <div style="height: 60px;"></div>
                </div>
                
                <!-- Кнопка скрытия/открытия панели -->
                <button id="toggle-sidebar" class="main-btn position-fixed" style="top: 50%; left: 300px; transform: translateY(-50%); z-index: 1001; border-radius: 0 4px 4px 0; height: 50px; width: 30px; padding: 0;">
                    <i class="bi bi-chevron-left"></i>
                </button>
            </div>
        `;
        
        // Добавляем обработчики событий
        this.setupEventListeners();
        
        // Инициализируем панораму
        setTimeout(() => {
            this.initPanorama();
        }, 100);
        
        // Добавляем обработчик для кнопки скрытия/показа панели
        this.setupSidebarToggle();
    }

    /**
     * Добавляет обработчики событий
     */
    setupEventListeners() {
        // Выбор этажа
        const floorButtons = document.querySelectorAll('.public-floor-btn');
        floorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Останавливаем аудио, если оно воспроизводится
                this.stopAllAudio();
                
                this.currentFloorIndex = parseInt(e.currentTarget.dataset.floorIndex);
                this.currentRoomIndex = 0;
                this.renderContent();
            });
        });

        // Выбор комнаты
        const roomButtons = document.querySelectorAll('.public-room-btn');
        roomButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Останавливаем аудио, если оно воспроизводится
                this.stopAllAudio();
                
                this.currentRoomIndex = parseInt(e.currentTarget.dataset.roomIndex);
                this.renderContent();
            });
        });
    }

    /**
     * Останавливает все аудиогиды
     */
    stopAllAudio() {
        // Останавливаем аудио комнаты
        const roomAudio = document.getElementById('room-audio');
        if (roomAudio) {
            roomAudio.pause();
            roomAudio.currentTime = 0;
            
            // Удаляем элемент аудио из DOM
            roomAudio.parentNode.removeChild(roomAudio);
        }
        
        // Останавливаем аудио этажа
        const floorAudio = document.getElementById('floor-audio');
        if (floorAudio) {
            floorAudio.pause();
            floorAudio.currentTime = 0;
            
            // Удаляем элемент аудио из DOM
            floorAudio.parentNode.removeChild(floorAudio);
        }
        
        // Очищаем все интервалы обновления времени
        clearInterval(window.roomTimeUpdateInterval);
        clearInterval(window.floorTimeUpdateInterval);
    }

    /**
     * Инициализирует панораму
     */
    initPanorama() {
        const panoramaContainer = document.getElementById('public-panorama');
        if (!panoramaContainer) return;
        
        const org = this.userData.Org[this.currentOrgIndex];
        const floor = org.Floor && org.Floor.length > 0 ? 
            org.Floor[this.currentFloorIndex] : null;
        
        if (!floor || !floor.Room || floor.Room.length === 0) {
            panoramaContainer.innerHTML = `
                <div class="main-card m-3">
                    <div class="main-card-body">
                        <i class="bi bi-exclamation-circle me-2" style="color: #6e8efb;"></i>
                        Нет доступных панорам
                    </div>
                </div>
            `;
            return;
        }
        
        const room = floor.Room[this.currentRoomIndex];
        if (!room.ImageRoom) {
            panoramaContainer.innerHTML = `
                <div class="main-card m-3">
                    <div class="main-card-body">
                        <i class="bi bi-exclamation-circle me-2" style="color: #6e8efb;"></i>
                        Панорама для этой комнаты не доступна
                    </div>
                </div>
            `;
            return;
        }
        
        const panoramaUrl = `http://localhost:1337${room.ImageRoom.url}`;
        
        // Показываем загрузочный индикатор
        panoramaContainer.innerHTML = `
            <div class="loading-container d-flex justify-content-center align-items-center" style="height: 100%;">
                <div class="spinner-border" role="status" style="width: 3rem; height: 3rem; color: #6e8efb;">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
            </div>
        `;
        
        // Инициализируем A-Frame
        setTimeout(() => {
            try {
                // Очищаем контейнер
                panoramaContainer.innerHTML = '';
                
                // Создаем A-Frame сцену
                const scene = document.createElement('a-scene');
                scene.setAttribute('embedded', '');
                scene.setAttribute('vr-mode-ui', 'enabled: false');
                scene.setAttribute('loading-screen', 'enabled: false');
                scene.style.width = '100%';
                scene.style.height = '100%';
                
                // Создаем asset контейнер
                const assets = document.createElement('a-assets');
                
                // Создаем изображение
                const img = document.createElement('img');
                const imgId = `panorama-img-${Date.now()}`;
                img.setAttribute('id', imgId);
                img.setAttribute('src', panoramaUrl);
                img.setAttribute('crossorigin', 'anonymous');
                
                // Обработчик загрузки изображения
                img.onload = () => {
                    console.log('Изображение панорамы загружено успешно');
                    this.panoramaLoaded = true;
                };
                
                // Обработчик ошибки загрузки
                img.onerror = () => {
                    console.error('Ошибка загрузки изображения панорамы');
                    panoramaContainer.innerHTML = `
                        <div class="main-card m-3">
                            <div class="main-card-body">
                                <i class="bi bi-exclamation-triangle-fill me-2" style="color: #ff5e62;"></i>
                                Ошибка загрузки изображения панорамы
                            </div>
                        </div>
                    `;
                };
                
                // Добавляем изображение в assets
                assets.appendChild(img);
                
                // Создаем панорамное небо
                const sky = document.createElement('a-sky');
                sky.setAttribute('src', `#${imgId}`);
                sky.setAttribute('rotation', '0 -90 0');
                
                // Создаем камеру
                const camera = document.createElement('a-camera');
                camera.setAttribute('position', '0 0 0');
                camera.setAttribute('look-controls', 'touchEnabled: true; mouseEnabled: true; pointerLockEnabled: true;');
                // Добавляем прицел-курсор
                const cursor = document.createElement('a-cursor');
                cursor.setAttribute('color', '#fff');
                cursor.setAttribute('fuse', 'true');
                cursor.setAttribute('fuse-timeout', '1000');
                cursor.setAttribute('animation__mouseenter', 'property: scale; to: 1.5 1.5 1; startEvents: mouseenter; dur: 150');
                cursor.setAttribute('animation__mouseleave', 'property: scale; to: 1 1 1; startEvents: mouseleave; dur: 150');
                camera.appendChild(cursor);
                
                // Собираем структуру сцены
                scene.appendChild(assets);
                scene.appendChild(sky);
                scene.appendChild(camera);

                // --- HOTSPOTS ---
                // Строим массив hotspot-ов для текущей комнаты
                let hotspots = [];
                // Пример: если есть другие комнаты на этом этаже, делаем переходы между ними
                if (floor.Room.length > 1) {
                    for (let r = 0; r < floor.Room.length; r++) {
                        if (r === this.currentRoomIndex) continue;
                        const targetRoom = floor.Room[r];
                        hotspots.push({
                            yaw: 45 + r * 90, // Просто для примера, можно сделать красивее
                            pitch: 0,
                            title: `Перейти в ${targetRoom.Title}`,
                            targetRoomId: targetRoom.id
                        });
                    }
                }
                // Можно добавить дополнительные хотспоты по желанию
                // --- END построения хотспотов ---
                if (Array.isArray(hotspots)) {
                    hotspots.forEach(hotspot => {
                        const radius = 5;
                        const yaw = (hotspot.yaw || 0) * Math.PI / 180;
                        const pitch = (hotspot.pitch || 0) * Math.PI / 180;
                        const x = radius * Math.cos(pitch) * Math.sin(yaw);
                        const y = radius * Math.sin(pitch);
                        const z = -radius * Math.cos(pitch) * Math.cos(yaw);

                        const hotspotEntity = document.createElement('a-entity');
                        hotspotEntity.setAttribute('geometry', 'primitive: circle; radius: 0.3');
                        hotspotEntity.setAttribute('material', 'color: #ff5e62; opacity: 0.85; side: double');
                        hotspotEntity.setAttribute('position', `${x} ${y} ${z}`);
                        hotspotEntity.setAttribute('look-at', '[camera]');
                        hotspotEntity.setAttribute('class', 'panorama-hotspot');
                        hotspotEntity.setAttribute('event-set__mouseenter', 'scale: 1.5 1.5 1');
                        hotspotEntity.setAttribute('event-set__mouseleave', 'scale: 1 1 1');
                        hotspotEntity.setAttribute('title', hotspot.title || 'Hotspot');
                        hotspotEntity.addEventListener('click', () => {
                            if (hotspot.targetRoomId) {
                                const found = this.findRoomById(hotspot.targetRoomId);
                                if (found) {
                                    this.currentFloorIndex = found.floorIndex;
                                    this.currentRoomIndex = found.roomIndex;
                                    this.renderContent();
                                }
                            }
                        });
                        // Добавляем 3D-текст над хотспотом
                        const textEntity = document.createElement('a-text');
                        textEntity.setAttribute('value', hotspot.title || 'Hotspot');
                        textEntity.setAttribute('align', 'center');
                        textEntity.setAttribute('color', '#fff');
                        textEntity.setAttribute('width', '10');
                        textEntity.setAttribute('position', `0 0.6 0`);
                        textEntity.setAttribute('side', 'double');
                        textEntity.setAttribute('face-camera', '');
                        hotspotEntity.appendChild(textEntity);
                        scene.appendChild(hotspotEntity);
                    });
                }
                // --- END HOTSPOTS ---
                
                // Добавляем сцену в контейнер
                panoramaContainer.appendChild(scene);
                
                // Добавляем информацию о текущей комнате (на верхнем правом углу)
                const roomInfo = document.createElement('div');
                roomInfo.className = 'position-absolute';
                roomInfo.style.top = '20px';
                roomInfo.style.right = '20px';
                roomInfo.style.zIndex = '1005';
                roomInfo.style.fontSize = '1rem';
                roomInfo.style.padding = '8px 15px';
                roomInfo.style.background = 'linear-gradient(135deg, #6e8efb, #a777e3)';
                roomInfo.style.color = 'white';
                roomInfo.style.borderRadius = '8px';
                roomInfo.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                roomInfo.style.fontWeight = '600';
                roomInfo.style.transition = 'all 0.3s ease';
                roomInfo.innerHTML = `
                    <i class="bi bi-geo-alt-fill me-1"></i>
                    ${room.Title}
                `;
                
                // Добавляем эффекты при наведении
                roomInfo.addEventListener('mouseover', () => {
                    roomInfo.style.transform = 'translateY(-3px)';
                    roomInfo.style.boxShadow = '0 6px 12px rgba(110, 142, 251, 0.6)';
                });
                
                roomInfo.addEventListener('mouseout', () => {
                    roomInfo.style.transform = 'translateY(0)';
                    roomInfo.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                });
                
                panoramaContainer.appendChild(roomInfo);
                
                // Добавляем мини-карту в левый нижний угол
                if (floor.ImageMap) {
                    // Сначала удаляем старую мини-карту, если она есть
                    const oldMiniMap = panoramaContainer.querySelector('.mini-map');
                    if (oldMiniMap) {
                        oldMiniMap.remove();
                    }
                    
                    const miniMap = document.createElement('div');
                    miniMap.className = 'mini-map';
                    
                    // Проверяем, скрыт ли сайдбар, и устанавливаем начальную позицию мини-карты
                    const sidebar = document.querySelector('.sidebar-panel');
                    const initialLeft = sidebar && !sidebar.classList.contains('sidebar-hidden') ? '320px' : '20px';
                    
                    miniMap.style.left = initialLeft;
                    miniMap.style.transition = 'left 0.3s ease';
                    
                    miniMap.innerHTML = `
                        <div class="mini-map-content">
                            <img src="http://localhost:1337${floor.ImageMap.url}" class="img-fluid" alt="Мини-карта">
                            <div class="mini-map-marker" style="left: ${room.pointX}%; top: ${room.pointY}%;"></div>
                        </div>
                    `;
                    panoramaContainer.appendChild(miniMap);
                }
                
                // Добавляем кнопку аудио, если есть аудиофайл для комнаты
                if (room.audioFile && room.audioFile.url) {
                    const audioUrl = `http://localhost:1337${room.audioFile.url}`;
                    
                    // Создаем аудио элемент
                    const audio = document.createElement('audio');
                    audio.setAttribute('id', 'room-audio');
                    audio.setAttribute('src', audioUrl);
                    audio.setAttribute('preload', 'auto');
                    document.body.appendChild(audio);
                    
                    // Добавляем кнопку для воспроизведения аудио
                    const audioBtn = document.createElement('div');
                    audioBtn.className = 'position-absolute audio-guide-btn';
                    audioBtn.style.top = '20px';
                    audioBtn.style.left = '320px'; // Позиция справа от сайдбара
                    audioBtn.style.zIndex = '1005';
                    audioBtn.style.fontSize = '1rem';
                    audioBtn.style.padding = '8px 15px';
                    audioBtn.style.background = 'linear-gradient(135deg, #6e8efb, #a777e3)';
                    audioBtn.style.color = 'white';
                    audioBtn.style.borderRadius = '8px';
                    audioBtn.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                    audioBtn.style.fontWeight = '600';
                    audioBtn.style.transition = 'all 0.3s ease';
                    audioBtn.style.cursor = 'pointer';
                    audioBtn.innerHTML = `
                        <i class="bi bi-play-fill me-1"></i>
                        Аудиогид
                    `;
                    
                    let isPlaying = false;
                    
                    // Добавляем обработчик нажатия
                    audioBtn.addEventListener('click', () => {
                        const audioElement = document.getElementById('room-audio');
                        if (isPlaying) {
                            audioElement.pause();
                            audioBtn.innerHTML = `
                                <i class="bi bi-play-fill me-1"></i>
                                Аудиогид
                            `;
                            clearInterval(window.roomTimeUpdateInterval);
                        } else {
                            audioElement.play();
                            
                            // Функция для форматирования времени
                            const formatTime = (seconds) => {
                                const mins = Math.floor(seconds / 60);
                                const secs = Math.floor(seconds % 60);
                                return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                            };
                            
                            // Обновляем время каждую секунду
                            window.roomTimeUpdateInterval = setInterval(() => {
                                const remainingTime = audioElement.duration - audioElement.currentTime;
                                if (!isNaN(remainingTime) && isFinite(remainingTime)) {
                                    audioBtn.innerHTML = `
                                        <i class="bi bi-pause-fill me-1"></i>
                                        Пауза (${formatTime(remainingTime)})
                                    `;
                                }
                            }, 1000);
                            
                            // Начальное отображение времени
                            audioBtn.innerHTML = `
                                <i class="bi bi-pause-fill me-1"></i>
                                Пауза (загрузка...)
                            `;
                            
                            // Когда метаданные загружены, можно получить duration
                            audioElement.addEventListener('loadedmetadata', () => {
                                const remainingTime = audioElement.duration - audioElement.currentTime;
                                audioBtn.innerHTML = `
                                    <i class="bi bi-pause-fill me-1"></i>
                                    Пауза (${formatTime(remainingTime)})
                                `;
                            });
                        }
                        isPlaying = !isPlaying;
                    });
                    
                    // Добавляем эффекты при наведении
                    audioBtn.addEventListener('mouseover', () => {
                        audioBtn.style.transform = 'translateY(-3px)';
                        audioBtn.style.boxShadow = '0 6px 12px rgba(110, 142, 251, 0.6)';
                    });
                    
                    audioBtn.addEventListener('mouseout', () => {
                        audioBtn.style.transform = 'translateY(0)';
                        audioBtn.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                    });
                    
                    panoramaContainer.appendChild(audioBtn);
                    
                    // Обрабатываем завершение воспроизведения
                    audio.addEventListener('ended', () => {
                        isPlaying = false;
                        audioBtn.innerHTML = `
                            <i class="bi bi-play-fill me-1"></i>
                            Аудиогид
                        `;
                        clearInterval(window.roomTimeUpdateInterval);
                    });
                }
                // Проверяем наличие аудио для этажа, если нет аудио для комнаты
                else if (floor.audioFile && Array.isArray(floor.audioFile) && floor.audioFile.length > 0) {
                    const floorAudioUrl = `http://localhost:1337${floor.audioFile[0].url}`;
                    
                    // Создаем аудио элемент
                    const floorAudio = document.createElement('audio');
                    floorAudio.setAttribute('id', 'floor-audio');
                    floorAudio.setAttribute('src', floorAudioUrl);
                    floorAudio.setAttribute('preload', 'auto');
                    document.body.appendChild(floorAudio);
                    
                    // Добавляем кнопку для воспроизведения аудио этажа
                    const floorAudioBtn = document.createElement('div');
                    floorAudioBtn.className = 'position-absolute audio-guide-floor-btn';
                    floorAudioBtn.style.top = '20px';
                    floorAudioBtn.style.left = '320px'; // Позиция справа от сайдбара
                    floorAudioBtn.style.zIndex = '1005';
                    floorAudioBtn.style.fontSize = '1rem';
                    floorAudioBtn.style.padding = '8px 15px';
                    floorAudioBtn.style.background = 'linear-gradient(135deg, #6e8efb, #a777e3)';
                    floorAudioBtn.style.color = 'white';
                    floorAudioBtn.style.borderRadius = '8px';
                    floorAudioBtn.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                    floorAudioBtn.style.fontWeight = '600';
                    floorAudioBtn.style.transition = 'all 0.3s ease';
                    floorAudioBtn.style.cursor = 'pointer';
                    floorAudioBtn.innerHTML = `
                        <i class="bi bi-play-fill me-1"></i>
                        Аудиогид этажа
                    `;
                    
                    let isFloorAudioPlaying = false;
                    
                    // Добавляем обработчик нажатия
                    floorAudioBtn.addEventListener('click', () => {
                        const floorAudioElement = document.getElementById('floor-audio');
                        if (isFloorAudioPlaying) {
                            floorAudioElement.pause();
                            floorAudioBtn.innerHTML = `
                                <i class="bi bi-play-fill me-1"></i>
                                Аудиогид этажа
                            `;
                            clearInterval(window.floorTimeUpdateInterval);
                        } else {
                            floorAudioElement.play();
                            
                            // Функция для форматирования времени
                            const formatTime = (seconds) => {
                                const mins = Math.floor(seconds / 60);
                                const secs = Math.floor(seconds % 60);
                                return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                            };
                            
                            // Обновляем время каждую секунду
                            window.floorTimeUpdateInterval = setInterval(() => {
                                const remainingTime = floorAudioElement.duration - floorAudioElement.currentTime;
                                if (!isNaN(remainingTime) && isFinite(remainingTime)) {
                                    floorAudioBtn.innerHTML = `
                                        <i class="bi bi-pause-fill me-1"></i>
                                        Пауза (${formatTime(remainingTime)})
                                    `;
                                }
                            }, 1000);
                            
                            // Начальное отображение времени
                            floorAudioBtn.innerHTML = `
                                <i class="bi bi-pause-fill me-1"></i>
                                Пауза (загрузка...)
                            `;
                            
                            // Когда метаданные загружены, можно получить duration
                            floorAudioElement.addEventListener('loadedmetadata', () => {
                                const remainingTime = floorAudioElement.duration - floorAudioElement.currentTime;
                                floorAudioBtn.innerHTML = `
                                    <i class="bi bi-pause-fill me-1"></i>
                                    Пауза (${formatTime(remainingTime)})
                                `;
                            });
                        }
                        isFloorAudioPlaying = !isFloorAudioPlaying;
                    });
                    
                    // Добавляем эффекты при наведении
                    floorAudioBtn.addEventListener('mouseover', () => {
                        floorAudioBtn.style.transform = 'translateY(-3px)';
                        floorAudioBtn.style.boxShadow = '0 6px 12px rgba(110, 142, 251, 0.6)';
                    });
                    
                    floorAudioBtn.addEventListener('mouseout', () => {
                        floorAudioBtn.style.transform = 'translateY(0)';
                        floorAudioBtn.style.boxShadow = '0 4px 10px rgba(110, 142, 251, 0.4)';
                    });
                    
                    panoramaContainer.appendChild(floorAudioBtn);
                    
                    // Обрабатываем завершение воспроизведения
                    floorAudio.addEventListener('ended', () => {
                        isFloorAudioPlaying = false;
                        floorAudioBtn.innerHTML = `
                            <i class="bi bi-play-fill me-1"></i>
                            Аудиогид этажа
                        `;
                        clearInterval(window.floorTimeUpdateInterval);
                    });
                }
                
                // Обработчик загрузки сцены
                scene.addEventListener('loaded', () => {
                    console.log('A-Frame сцена загружена');
                });
            } catch (error) {
                console.error('Ошибка инициализации панорамы:', error);
                panoramaContainer.innerHTML = `
                    <div class="main-card m-3">
                        <div class="main-card-body">
                            <i class="bi bi-exclamation-triangle-fill me-2" style="color: #ff5e62;"></i>
                            Ошибка инициализации панорамы
                        </div>
                    </div>
                `;
            }
        }, 100);
    }

    /**
     * Настраивает переключение видимости боковой панели
     */
    setupSidebarToggle() {
        const toggleButton = document.getElementById('toggle-sidebar');
        const sidebar = document.querySelector('.sidebar-panel');
        
        if (toggleButton && sidebar) {
            toggleButton.addEventListener('click', () => {
                // Проверяем текущее состояние и переключаем его
                const isHidden = sidebar.classList.contains('sidebar-hidden');
                this.toggleSidebar(!isHidden);
            });
        }
    }
    
    /**
     * Переключает видимость боковой панели и перемещает мини-карту
     * @param {boolean} hide - True для скрытия панели, false для отображения
     */
    toggleSidebar(hide) {
        const sidebar = document.querySelector('.sidebar-panel');
        const toggleButton = document.getElementById('toggle-sidebar');
        const miniMap = document.querySelector('.mini-map');
        const roomAudioBtn = document.querySelector('.audio-guide-btn');
        const floorAudioBtn = document.querySelector('.audio-guide-floor-btn');
        
        if (!sidebar) return;
        
        if (hide) {
            // Скрываем боковую панель
            sidebar.classList.add('sidebar-hidden');
            sidebar.style.transform = 'translateX(-100%)';
            
            // Меняем иконку на кнопке и перемещаем её к левому краю
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
                toggleButton.style.left = '0';
            }
            
            // Если есть мини-карта, переместим ее левее
            if (miniMap) {
                miniMap.style.left = '20px';
                miniMap.style.transition = 'left 0.3s ease';
            }
            
            // Если есть кнопки аудио, переместим их левее
            if (roomAudioBtn) {
                roomAudioBtn.style.left = '20px';
                roomAudioBtn.style.transition = 'left 0.3s ease';
            }
            
            if (floorAudioBtn) {
                floorAudioBtn.style.left = '20px';
                floorAudioBtn.style.transition = 'left 0.3s ease';
            }
        } else {
            // Показываем боковую панель
            sidebar.classList.remove('sidebar-hidden');
            sidebar.style.transform = 'translateX(0)';
            
            // Меняем иконку на кнопке и перемещаем её к правому краю сайдбара
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
                toggleButton.style.left = '300px';
            }
            
            // Если есть мини-карта, переместим ее правее
            if (miniMap) {
                miniMap.style.left = '320px';
                miniMap.style.transition = 'left 0.3s ease';
            }
            
            // Если есть кнопки аудио, переместим их правее
            if (roomAudioBtn) {
                roomAudioBtn.style.left = '320px';
                roomAudioBtn.style.transition = 'left 0.3s ease';
            }
            
            if (floorAudioBtn) {
                floorAudioBtn.style.left = '320px';
                floorAudioBtn.style.transition = 'left 0.3s ease';
            }
        }
    }

    // Универсальный поиск комнаты по id, возвращает {floorIndex, roomIndex}
    findRoomById(roomId) {
        const org = this.userData.Org[this.currentOrgIndex];
        for (let f = 0; f < org.Floor.length; f++) {
            const floor = org.Floor[f];
            if (!floor.Room) continue;
            for (let r = 0; r < floor.Room.length; r++) {
                if (floor.Room[r].id === roomId) {
                    return { floorIndex: f, roomIndex: r };
                }
            }
        }
        return null;
    }
}

// Инициализируем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.publicViewApp = new PublicViewApp();
});

AFRAME.registerComponent('face-camera', {
    tick: function () {
        if (!this.el.sceneEl.camera) return;
        const cam = this.el.sceneEl.camera.el;
        const camWorldPos = new THREE.Vector3();
        cam.object3D.getWorldPosition(camWorldPos);
        const objWorldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(objWorldPos);
        this.el.object3D.lookAt(camWorldPos);
        // Поворачиваем только по Y (чтобы не инвертировался при взгляде сзади)
        const rot = this.el.object3D.rotation;
        this.el.object3D.rotation.set(0, rot.y, 0);
    }
});