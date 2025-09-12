// Street View Random Visualizer - Main Application Logic

class StreetViewApp {
    constructor() {
        // State variables
        this.currentLocationRealName = '';
        this.currentLocationFantasyName = '';
        this.currentLocationUrl = '';
        this.isCurrentLocationInHistory = false;
        this.locationHistory = [];
        this.avoidDuplicates = false;

        // Fantasy name generation data
        this.fantasyAdjectives = [
            'Mágico', 'Estelar', 'Antiguo', 'Secreto', 'Cósmico', 'Misterioso',
            'Silencioso', 'Radiante', 'Espectacular', 'Fantástico', 'Imponente',
            'Celestial', 'Galáctico', 'Etereo', 'Brillante', 'Oculto', 'Lejano', 
            'Increíble', 'Sublime', 'Épico', 'Inolvidable', 'Bello', 'Dulce',
            'Magnífico', 'Bonito', 'Majestuoso', 'Divino', 'Espléndido', 'Gran',
            'Hermoso', 'Maravilloso', 'Icónico', 'Precioso', 'Inmenso',
            'Acogedor',
        ];
        this.fantasyNouns = [
            'Valle', 'Bosque', 'Templo', 'Jardín', 'Cerro', 'Ciudad', 'Mirador', 
            'Puerto', 'Río', 'Cráter', 'Choclo', 'Enchufe', 'Celular', 'Parque',
            'Castillo', 'Laberinto', 'Desierto', 'Glaciar', 'Lugar', 'Paisaje',
            'Pantano', 'Camino', 'Volcán', 'Lago', 'Playa', 'Montaña', 'Pueblo',
            'Callejón', 'Sendero', 'Árbol', 'Cielo', 'Mar',
        ];
        this.emojis = [
            '✨', '🌌', '🌿', '🏰', '⛰️', '🏙️', '🔭', '🏝️', '🌊', '❄️', '🌋', '✈',
            '🌽', '🔌', '✉️', '📱', '🦄', '🌈', '🔮', '🗺️', '💎', '🔑', '🌵', '🚂',
            '🎨', '🌳', '🤩', '🤯', '📸', '🌟', '🌎',
        ];

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // DOM elements
        this.elements = {
            urlsTextarea: document.getElementById('urls'),
            randomButton: document.getElementById('randomButton'),
            streetViewFrame: document.getElementById('streetViewFrame'),
            placeholder: document.getElementById('placeholder'),
            streetViewContainer: document.getElementById('streetViewContainer'),
            showNameButton: document.getElementById('showNameButton'),
            nameDisplay: document.getElementById('nameDisplay'),
            selectedRealNameElement: document.getElementById('selectedRealName'),
            urlDisplayContainer: document.getElementById('urlDisplayContainer'),
            selectedUrlElement: document.getElementById('selectedUrl'),
            historyList: document.getElementById('historyList'),
            historySection: document.getElementById('historySection'),
            fullscreenButton: document.getElementById('fullscreenButton'),
            avoidDuplicatesToggle: document.getElementById('avoid-duplicates-toggle'),
            formHeader: document.getElementById('formHeader'),
            formContent: document.getElementById('formContent'),
            toggleArrow: document.getElementById('toggleArrow')
        };
    }

    attachEventListeners() {
        // Form collapse functionality with animation
        this.elements.formHeader.addEventListener('click', () => {
            this.toggleFormContent();
        });

        // Main functionality
        this.elements.randomButton.addEventListener('click', () => this.showRandomLocation());
        this.elements.showNameButton.addEventListener('click', () => this.revealLocationName());
        this.elements.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        this.elements.avoidDuplicatesToggle.addEventListener('change', (event) => {
            this.avoidDuplicates = event.target.checked;
        });

        // Fullscreen change detection
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    }

    toggleFormContent() {
        const isCollapsed = this.elements.formContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            this.elements.formContent.classList.remove('collapsed');
            this.elements.formContent.classList.add('expanded');
            this.elements.toggleArrow.classList.remove('rotate-180');
        } else {
            // Collapse
            this.elements.formContent.classList.remove('expanded');
            this.elements.formContent.classList.add('collapsed');
            this.elements.toggleArrow.classList.add('rotate-180');
        }
    }

    generateConsistentFantasyName(url) {
        let hash = 0;
        if (url.length === 0) return "Ubicación Sin Nombre ❓";
        
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to a 32bit integer
        }
        
        const adjIndex = Math.abs(hash) % this.fantasyAdjectives.length;
        const nounIndex = Math.abs(hash * 2) % this.fantasyNouns.length;
        const emojiIndex = Math.abs(hash * 3) % this.emojis.length;
        
        return `${this.fantasyAdjectives[adjIndex]} ${this.fantasyNouns[nounIndex]} ${this.emojis[emojiIndex]}`;
    }

    parseLocationData(urlsInput) {
        return urlsInput.split('\n')
            .map(line => {
                const parts = line.split(',');
                let url = parts[0] ? parts[0].trim() : '';
                const name = parts[1] ? parts.slice(1).join(',').trim() : 'Nombre no disponible';

                // Extract URL from iframe tag if present
                if (url.startsWith('<iframe')) {
                    const srcMatch = url.match(/src="([^"]+)"/);
                    if (srcMatch && srcMatch[1]) {
                        url = srcMatch[1].replace(/&amp;/g, '&');
                    }
                }
                return { url, name };
            })
            .filter(loc => loc.url.includes('google.com/maps/embed'));
    }

    filterAvailableLocations(locations) {
        if (!this.avoidDuplicates) return locations;
        
        const revealedUrls = this.locationHistory.map(loc => loc.url);
        return locations.filter(loc => !revealedUrls.includes(loc.url));
    }

    showRandomLocation() {
        // Reset state
        this.resetLocationState();
        
        const urlsInput = this.elements.urlsTextarea.value;
        let locations = this.parseLocationData(urlsInput);
        locations = this.filterAvailableLocations(locations);

        if (locations.length === 0) {
            this.showNoLocationsMessage();
            return;
        }

        // Group locations by name and calculate probabilities
        const locationGroups = this.groupLocationsByName(locations);
        const selectedGroup = this.selectLocationGroupByProbability(locationGroups);
        const randomLocation = this.selectRandomLocationFromGroup(selectedGroup);
        const fantasyName = this.generateConsistentFantasyName(randomLocation.url);

        this.setCurrentLocation(randomLocation, fantasyName);
        this.displayLocation();
    }

    groupLocationsByName(locations) {
        const groups = {};
        
        locations.forEach(location => {
            const name = location.name;
            if (!groups[name]) {
                groups[name] = [];
            }
            groups[name].push(location);
        });
        
        return groups;
    }

    selectLocationGroupByProbability(locationGroups) {
        const uniqueNames = Object.keys(locationGroups);
        const randomIndex = Math.floor(Math.random() * uniqueNames.length);
        const selectedName = uniqueNames[randomIndex];
        
        return {
            name: selectedName,
            locations: locationGroups[selectedName]
        };
    }

    selectRandomLocationFromGroup(group) {
        const randomIndex = Math.floor(Math.random() * group.locations.length);
        return group.locations[randomIndex];
    }

    resetLocationState() {
        this.currentLocationRealName = '';
        this.currentLocationFantasyName = '';
        this.currentLocationUrl = '';
        this.elements.streetViewFrame.classList.add('zoomed-view');
        this.elements.streetViewFrame.classList.remove('unzoomed-view');
        this.elements.nameDisplay.classList.add('hidden');
    }

    setCurrentLocation(location, fantasyName) {
        this.currentLocationRealName = location.name;
        this.currentLocationFantasyName = fantasyName;
        this.currentLocationUrl = location.url;
        this.isCurrentLocationInHistory = false;
    }

    displayLocation() {
        this.elements.placeholder.classList.add('hidden');
        this.elements.streetViewFrame.src = this.currentLocationUrl;
        this.elements.streetViewFrame.classList.remove('hidden');
        this.elements.selectedUrlElement.innerHTML = 
            `<span class="font-bold">${this.currentLocationFantasyName}</span> - ${this.currentLocationUrl}`;
        this.elements.urlDisplayContainer.classList.remove('hidden');
    }

    showNoLocationsMessage() {
        this.elements.placeholder.textContent = 
            "¡Has explorado todas las ubicaciones! Desactiva 'Evitar repeticiones' o agrega nuevas ubicaciones.";
        this.elements.placeholder.classList.remove('hidden');
        this.elements.streetViewFrame.classList.add('hidden');
        this.elements.urlDisplayContainer.classList.add('hidden');
        this.elements.nameDisplay.classList.add('hidden');
        
        this.elements.streetViewContainer.classList.add('border-2', 'border-red-500');
        setTimeout(() => {
            this.elements.streetViewContainer.classList.remove('border-2', 'border-red-500');
        }, 2000);
    }

    revealLocationName() {
        if (!this.currentLocationRealName) return;

        this.elements.selectedRealNameElement.textContent = this.currentLocationRealName;
        this.elements.nameDisplay.classList.remove('hidden');
        
        // Launch confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Remove zoom
        this.elements.streetViewFrame.classList.remove('zoomed-view');
        this.elements.streetViewFrame.classList.add('unzoomed-view');

        // Add to history if not already added
        if (!this.isCurrentLocationInHistory) {
            this.addToHistory();
            this.isCurrentLocationInHistory = true;
        }
    }

    addToHistory() {
        this.locationHistory.unshift({
            url: this.currentLocationUrl,
            realName: this.currentLocationRealName,
            fantasyName: this.currentLocationFantasyName
        });
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        this.elements.historyList.innerHTML = '';
        
        // Show/hide history section based on whether there are locations
        if (this.locationHistory.length > 0) {
            this.elements.historySection.classList.remove('hidden');
        } else {
            this.elements.historySection.classList.add('hidden');
            return;
        }
        
        this.locationHistory.forEach((loc, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0';
            listItem.innerHTML = `
                <div class="flex-1 space-y-1">
                    <p class="text-sm font-semibold text-gray-300">
                        <span class="text-lg font-bold text-cyan-400">${loc.fantasyName}</span>
                        ${loc.realName ? ` (${loc.realName})` : ''}
                    </p>
                    <a href="${loc.url}" target="_blank" class="text-xs text-cyan-400 hover:underline break-all block">${loc.url}</a>
                </div>
                <button class="revisit-button bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400/50 shadow-md">
                    Revisitar
                </button>
            `;
            this.elements.historyList.appendChild(listItem);
        });

        // Add event listeners to revisit buttons
        document.querySelectorAll('.revisit-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                this.revisitLocation(this.locationHistory[index]);
            });
        });
    }

    revisitLocation(location) {
        this.currentLocationRealName = location.realName;
        this.currentLocationFantasyName = location.fantasyName;
        this.currentLocationUrl = location.url;
        this.isCurrentLocationInHistory = true;

        this.elements.placeholder.classList.add('hidden');
        this.elements.streetViewFrame.src = location.url;
        this.elements.streetViewFrame.classList.remove('hidden');
        this.elements.selectedUrlElement.innerHTML = 
            `<span class="font-bold">${this.currentLocationFantasyName}</span> - ${this.currentLocationUrl}`;
        this.elements.urlDisplayContainer.classList.remove('hidden');

        this.elements.selectedRealNameElement.textContent = this.currentLocationRealName;
        this.elements.nameDisplay.classList.remove('hidden');
        this.elements.streetViewFrame.classList.remove('zoomed-view');
        this.elements.streetViewFrame.classList.add('unzoomed-view');
    }

    toggleFullscreen() {
        if (this.elements.streetViewContainer.requestFullscreen) {
            this.elements.streetViewContainer.requestFullscreen();
        } else {
            console.error("Tu navegador no soporta la API de Pantalla Completa.");
        }
    }

    handleFullscreenChange() {
        if (document.fullscreenElement) {
            // Entered fullscreen - hide button
            this.elements.fullscreenButton.classList.add('hidden');
        } else {
            // Exited fullscreen - show button
            this.elements.fullscreenButton.classList.remove('hidden');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StreetViewApp();
});
