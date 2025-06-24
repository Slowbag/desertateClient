const baseUrl = 'https://strapi-api.ru.tuna.am';

/**
 * Main application module
 */
class App {
    constructor() {
        this.userData = null;
        this.currentOrgIndex = 0;
        this.currentFloorIndex = 0;
        this.currentRoomIndex = 0;
        this.panoramaLoaded = false;
        
        this.init();
    }

    

    /**
     * Initialize the application
     */
    init() {
        this.dynamicContent = document.getElementById('dynamic-content');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        document.addEventListener('userDataLoaded', this.handleUserDataLoaded.bind(this));
    }

    /**
     * Handle user data loaded event
     * @param {CustomEvent} event - User data loaded event
     */
    handleUserDataLoaded(event) {
        this.userData = event.detail;
        console.log('Полученные данные пользователя:', this.userData);
        
        // Выводим подробную информацию о структуре организаций
        if (this.userData.Org && this.userData.Org.length > 0) {
            console.log('Доступные организации:', this.userData.Org.length);
            this.userData.Org.forEach((org, index) => {
                console.log(`Организация ${index + 1}: ${org.Title}`);
                if (org.Floor && org.Floor.length > 0) {
                    console.log(`- Этажи: ${org.Floor.length}`);
                    org.Floor.forEach(floor => {
                        console.log(`-- Этаж: ${floor.Title}, Комнат: ${floor.Room ? floor.Room.length : 0}`);
                        if (floor.Room) {
                            floor.Room.forEach(room => {
                                console.log(`--- Комната: ${room.Title}, Изображение: ${room.ImageRoom ? 'Есть' : 'Нет'}`);
                            });
                        }
                    });
                }
            });
        }
        
        this.renderUI();
    }

    /**
     * Копирует ссылку на публичный просмотр в буфер обмена
     * @param {number} orgId - ID организации
     */
    copyPublicLink(orgId) {
        const publicUrl = `${baseUrl}/public-view.html?userId=${this.userData.id}&orgId=${orgId}`;
        
        // Используем современный API для копирования в буфер обмена
        navigator.clipboard.writeText(publicUrl)
            .then(() => {
                // Показываем уведомление об успешном копировании
                this.showCopyNotification('Ссылка скопирована!');
            })
            .catch(err => {
                console.error('Ошибка при копировании ссылки:', err);
                
                // Запасной вариант для браузеров, не поддерживающих Clipboard API
                this.fallbackCopyToClipboard(publicUrl);
            });
    }
    
    /**
     * Запасной метод копирования в буфер обмена через временный элемент input
     * @param {string} text - Текст для копирования
     */
    fallbackCopyToClipboard(text) {
        // Создаем временный элемент input
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Скрываем элемент
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopyNotification('Ссылка скопирована!');
            } else {
                this.showCopyNotification('Не удалось скопировать ссылку. Попробуйте еще раз.', 'warning');
            }
        } catch (err) {
            console.error('Ошибка при копировании:', err);
            this.showCopyNotification('Не удалось скопировать ссылку', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    /**
     * Показывает уведомление о копировании
     * @param {string} message - Сообщение для отображения
     * @param {string} type - Тип уведомления (success, warning, error)
     */
    showCopyNotification(message, type = 'success') {
        // Удаляем предыдущее уведомление, если оно есть
        const existingNotification = document.querySelector('.copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `copy-notification alert alert-${type === 'error' ? 'danger' : (type === 'warning' ? 'warning' : 'success')} position-fixed`;
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.maxWidth = '300px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        
        // Иконка в зависимости от типа уведомления
        let icon = 'check-circle-fill';
        if (type === 'warning') icon = 'exclamation-triangle-fill';
        if (type === 'error') icon = 'x-circle-fill';
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${icon} me-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Добавляем уведомление на страницу
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.add('fade');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Render the main UI
     */
    renderUI() {
        if (!this.userData || !this.userData.Org || this.userData.Org.length === 0) {
            this.renderNoOrganizationsMessage();
            return;
        }

        this.renderOrganizationUI();
    }

    /**
     * Render message when no organizations available
     */
    renderNoOrganizationsMessage() {
        this.dynamicContent.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-info" role="alert">
                    <h4 class="alert-heading">Нет доступных организаций</h4>
                    <p>У вас пока нет доступа ни к одной организации.</p>
                </div>
            </div>
        `;
    }

    /**
     * Render organization UI
     */
    renderOrganizationUI() {
        const org = this.userData.Org[this.currentOrgIndex];
        const floor = org.Floor && org.Floor.length > 0 ? 
            org.Floor[this.currentFloorIndex] : null;
        
        // Формируем ссылку на публичный просмотр
        const publicViewUrl = `public-view.html?userId=${this.userData.id}&orgId=${org.id}`;
        
        // Create container
        this.dynamicContent.innerHTML = `
            <div class="main-bg"></div>
            <div class="container-fluid main-content mt-3 mb-5">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="main-title">
                        <i class="bi bi-person-circle"></i>
                        Привет, ${this.userData.username}!
                    </h3>
                    <div>
                        <a href="${publicViewUrl}" class="main-btn me-2" target="_blank" style="text-decoration: none;">
                            <i class="bi bi-eye me-1"></i> Публичный просмотр
                        </a>
                        <button id="logout-button" class="main-btn main-btn-outline">
                            <i class="bi bi-box-arrow-right me-1"></i> Выйти
                        </button>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Organization and Floor Selection -->
                    <div class="col-md-3">
                        <div class="main-card mb-3">
                            <div class="main-card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-building me-2"></i>
                                    Организация
                                </h5>
                            </div>
                            <div class="main-card-body">
                                <select id="org-select" class="main-select mb-3">
                                    ${this.userData.Org.map((org, index) => 
                                        `<option value="${index}" ${index === this.currentOrgIndex ? 'selected' : ''}>${org.Title}</option>`
                                    ).join('')}
                                </select>
                                
                                <div class="main-input-group mb-3">
                                    <input type="text" class="main-input" value="${window.location.origin}/${publicViewUrl}" readonly id="public-link-input" style="padding-right: 110px;">
                                    <div class="position-absolute end-0 d-flex" style="top: 0; height: 100%;">
                                        <a href="${publicViewUrl}" class="main-btn" target="_blank" title="Открыть публичный просмотр" style="text-decoration: none; border-radius: 0; height: 100%;">
                                            <i class="bi bi-eye"></i>
                                        </a>
                                        <button class="main-btn share-btn" data-org-id="${org.id}" title="Поделиться" style="border-radius: 0; height: 100%;">
                                            <i class="bi bi-share"></i>
                                        </button>
                                        <button class="main-btn copy-link-input-btn" type="button" title="Скопировать ссылку" style="border-radius: 0 8px 8px 0; height: 100%;">
                                            <i class="bi bi-clipboard"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <h5 class="mt-4 mb-3">
                                    <i class="bi bi-layers me-2"></i>
                                    Этаж
                                </h5>
                                <div id="floor-buttons" class="d-flex flex-wrap gap-2 mb-3">
                                    ${org.Floor ? org.Floor.map((floor, index) => 
                                        `<button class="${index === this.currentFloorIndex ? 'main-btn' : 'main-btn main-btn-outline'} floor-btn" 
                                            data-floor-index="${index}">
                                            <i class="bi bi-stack me-1"></i> ${floor.Title}
                                        </button>`
                                    ).join('') : '<p>Нет доступных этажей</p>'}
                                </div>

                                ${floor && floor.Room && floor.Room.length > 0 ? `
                                    <h5 class="mt-4 mb-3">
                                        <i class="bi bi-door-open me-2"></i>
                                        Комнаты
                                    </h5>
                                    <div id="room-list" class="d-flex flex-wrap gap-2">
                                        ${floor.Room.map((room, index) => 
                                            `<button class="${index === this.currentRoomIndex ? 'main-btn' : 'main-btn main-btn-outline'} room-btn" 
                                                data-room-index="${index}">
                                                <i class="bi bi-door-closed me-2"></i> ${room.Title}
                                            </button>`
                                        ).join('')}
                                    </div>
                                ` : '<p class="mt-3">Нет доступных комнат</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- Map and Panorama View -->
                    <div class="col-md-9">
                        <div class="main-card mb-3">
                            <div class="main-card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-map me-2"></i>
                                    Карта этажа
                                </h5>
                            </div>
                            <div class="main-card-body overflow-auto" style="height: 300px;">
                                ${floor && floor.ImageMap ? 
                                    `<div class="position-relative">
                                        <img src="${baseUrl}${floor.ImageMap.url}" class="img-fluid" alt="План этажа">
                                        ${floor.Room ? floor.Room.map((room, index) => 
                                            `<button class="position-absolute room-map-marker ${index === this.currentRoomIndex ? 'active' : ''}"
                                                style="left: ${room.pointX}%; top: ${room.pointY}%;" data-room-index="${index}">
                                                ${room.Title}
                                            </button>`
                                        ).join('') : ''}
                                    </div>` 
                                : '<p>Карта этажа не доступна</p>'}
                            </div>
                        </div>

                        <div class="main-card mb-5">
                            <div class="main-card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-camera-video me-2"></i>
                                    Панорама
                                </h5>
                            </div>
                            <div class="main-card-body p-0 panorama-container" style="height: 480px;">
                                <div id="panorama-container">
                                    ${this.renderPanoramaView()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners after rendering
        this.setupOrganizationUIEventListeners();
        
        // Инициализируем панораму после рендеринга DOM
        setTimeout(() => {
            this.initPanorama();
        }, 100);
    }

    /**
     * Render panorama view
     * @returns {string} - HTML for panorama view
     */
    renderPanoramaView() {
        const org = this.userData.Org[this.currentOrgIndex];
        const floor = org.Floor && org.Floor.length > 0 ? 
            org.Floor[this.currentFloorIndex] : null;
        
        if (!floor || !floor.Room || floor.Room.length === 0) {
            return `
                <div class="main-card m-3">
                    <div class="main-card-body">
                        <i class="bi bi-exclamation-circle me-2" style="color: #6e8efb;"></i>
                        Нет доступных панорам
                    </div>
                </div>
            `;
        }

        const room = floor.Room[this.currentRoomIndex];
        console.log('Рендеринг панорамы для комнаты:', room);
        
        if (!room.ImageRoom) {
            console.warn('Для комнаты отсутствует изображение панорамы');
            return `
                <div class="main-card m-3">
                    <div class="main-card-body">
                        <i class="bi bi-exclamation-circle me-2" style="color: #6e8efb;"></i>
                        Панорама для этой комнаты не доступна
                    </div>
                </div>
            `;
        }
        
        console.log('Данные изображения панорамы:', room.ImageRoom);

        // Выбираем URL для изображения панорамы
        let panoramaUrl = `${baseUrl}${room.ImageRoom.url}`;
        console.log('Loading panorama image from:', panoramaUrl);
        
        // Возвращаем упрощенный вариант панорамы
        return `<div id="simple-panorama" class="w-100 h-100"></div>`;
    }

    /**
     * Initialize panorama using aframe.js after DOM has rendered
     */
    initPanorama() {
        const panoramaContainer = document.getElementById('simple-panorama');
        if (!panoramaContainer) return;
        
        const org = this.userData.Org[this.currentOrgIndex];
        const floor = org.Floor && org.Floor.length > 0 ? 
            org.Floor[this.currentFloorIndex] : null;
        
        if (!floor || !floor.Room || floor.Room.length === 0) return;
        
        const room = floor.Room[this.currentRoomIndex];
        if (!room.ImageRoom) return;
        
        const panoramaUrl = `${baseUrl}${room.ImageRoom.url}`;
        
        // Сначала показываем загрузочный индикатор
        panoramaContainer.innerHTML = `
            <div class="loading-container d-flex justify-content-center align-items-center" style="height: 100%;">
                <div class="spinner-border" role="status" style="width: 3rem; height: 3rem; color: #6e8efb;">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
            </div>
        `;
        
        // Создаем A-Frame сцену
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('vr-mode-ui', 'enabled: false');
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
        
        // Создаем панорамное небо
        const sky = document.createElement('a-sky');
        sky.setAttribute('src', `#${imgId}`);
        sky.setAttribute('rotation', '0 -90 0');
        
        // Создаем камеру
        const camera = document.createElement('a-camera');
        camera.setAttribute('position', '0 0 0');
        camera.setAttribute('look-controls', 'reverseMouseDrag: true');
        
        // Собираем структуру сцены
        assets.appendChild(img);
        scene.appendChild(assets);
        scene.appendChild(sky);
        scene.appendChild(camera);

        // --- HOTSPOTS ---
        if (Array.isArray(room.hotspots)) {
            room.hotspots.forEach(hotspot => {
                const radius = 10;
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
                hotspotEntity.setAttribute('cursor-listener', '');
                hotspotEntity.setAttribute('title', hotspot.title || 'Hotspot');
                hotspotEntity.setAttribute('hotspot-index', hotspot.targetRoomIndex ?? '');
                hotspotEntity.addEventListener('mouseenter', function () {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'hotspot-tooltip';
                    tooltip.style.position = 'fixed';
                    tooltip.style.left = '50%';
                    tooltip.style.top = '10%';
                    tooltip.style.transform = 'translate(-50%, 0)';
                    tooltip.style.background = '#fff';
                    tooltip.style.color = '#333';
                    tooltip.style.padding = '8px 16px';
                    tooltip.style.borderRadius = '8px';
                    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    tooltip.style.zIndex = '2000';
                    tooltip.textContent = hotspot.title || 'Hotspot';
                    tooltip.id = 'hotspot-tooltip';
                    document.body.appendChild(tooltip);
                });
                hotspotEntity.addEventListener('mouseleave', function () {
                    const tooltip = document.getElementById('hotspot-tooltip');
                    if (tooltip) tooltip.remove();
                });
                hotspotEntity.addEventListener('click', () => {
                    if (typeof hotspot.targetRoomIndex === 'number') {
                        this.currentRoomIndex = hotspot.targetRoomIndex;
                        this.renderOrganizationUI();
                    }
                });
                scene.appendChild(hotspotEntity);
            });
        }
        // --- END HOTSPOTS ---

        // Обработчик загрузки изображения
        img.onload = () => {
            console.log('Изображение панорамы загружено');
            
            // Очищаем контейнер
            panoramaContainer.innerHTML = '';
            
            // Добавляем сцену
            panoramaContainer.appendChild(scene);
            
            // Добавляем информацию о текущей комнате
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
            
            // Добавляем кнопку аудио, если есть аудиофайл
            if (room.audioFile && room.audioFile.url) {
                const audioUrl = `${baseUrl}${room.audioFile.url}`;
                
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
                audioBtn.style.left = '20px'; // Позиция справа от сайдбара
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
            
            // Проверяем наличие аудио для этажа
            if (floor.audioFile && Array.isArray(floor.audioFile) && floor.audioFile.length > 0 && (!room.audioFile || !room.audioFile.url)) {
                const floorAudioUrl = `${baseUrl}${floor.audioFile[0].url}`;
                
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
                floorAudioBtn.style.left = '20px'; // Позиция справа от сайдбара
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
    }

    /**
     * Setup event listeners for organization UI
     */
    setupOrganizationUIEventListeners() {
        // Organization select change
        const orgSelect = document.getElementById('org-select');
        if (orgSelect) {
            orgSelect.addEventListener('change', (e) => {
                // Останавливаем аудио, если оно воспроизводится
                this.stopAllAudio();
                
                this.currentOrgIndex = parseInt(e.target.value);
                this.currentFloorIndex = 0;
                this.currentRoomIndex = 0;
                this.renderOrganizationUI();
            });
        }

        // Floor buttons click
        const floorButtons = document.querySelectorAll('.floor-btn');
        floorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Останавливаем аудио, если оно воспроизводится
                this.stopAllAudio();
                
                this.currentFloorIndex = parseInt(e.target.dataset.floorIndex);
                this.currentRoomIndex = 0;
                this.renderOrganizationUI();
            });
        });

        // Room buttons click
        const roomButtons = document.querySelectorAll('.room-btn, .room-map-marker');
        roomButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Останавливаем аудио, если оно воспроизводится
                this.stopAllAudio();
                
                this.currentRoomIndex = parseInt(e.target.dataset.roomIndex);
                this.renderOrganizationUI();
            });
        });
        
        // Logout button click
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                if (window.authModule) {
                    window.authModule.logout();
                }
            });
        }
        
        // Копирование ссылки из input
        const copyLinkInputBtn = document.querySelector('.copy-link-input-btn');
        if (copyLinkInputBtn) {
            copyLinkInputBtn.addEventListener('click', () => {
                const linkInput = document.getElementById('public-link-input');
                if (linkInput) {
                    linkInput.select();
                    navigator.clipboard.writeText(linkInput.value)
                        .then(() => {
                            this.showCopyNotification('Ссылка скопирована!');
                        })
                        .catch(err => {
                            console.error('Ошибка при копировании ссылки:', err);
                            this.fallbackCopyToClipboard(linkInput.value);
                        });
                }
            });
        }
        
        // Кнопка "Поделиться"
        const shareButtons = document.querySelectorAll('.share-btn');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const orgId = parseInt(e.currentTarget.dataset.orgId);
                const shareUrl = `${window.location.origin}public-view.html?userId=${this.userData.id}&orgId=${orgId}`;
                
                // Проверяем поддержку Web Share API
                if (navigator.share) {
                    navigator.share({
                        title: `Просмотр панорам организации "${this.userData.Org[this.currentOrgIndex].Title}"`,
                        url: shareUrl
                    })
                    .catch(error => console.log('Ошибка при использовании share API:', error));
                } else {
                    // Если Web Share API не поддерживается, копируем ссылку
                    this.copyPublicLink(orgId);
                }
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
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 