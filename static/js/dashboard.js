document.addEventListener('DOMContentLoaded', function() {
    // Background animations
    if (document.querySelector('.stars-container')) {
        const starsContainer = document.querySelector('.stars-container');
        const starCount = 50;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            starsContainer.appendChild(star);
        }
    }
    
    // Event data management
    let events = JSON.parse(localStorage.getItem('petEvents')) || [];
    
    // Pets data management
    let pets = JSON.parse(localStorage.getItem('pets')) || [];
    
    // Calendar Modal
    const calendarModal = document.getElementById('calendarModal');
    const showCalendarBtn = document.getElementById('showCalendarBtn');
    const closeCalendarBtn = document.querySelector('.close-modal');
    
    if (showCalendarBtn && calendarModal) {
        showCalendarBtn.addEventListener('click', function() {
            calendarModal.style.display = 'flex';
            setTimeout(() => {
                calendarModal.style.opacity = '1';
            }, 10);
        });
        
        closeCalendarBtn.addEventListener('click', closeCalendarModal);
        
        // Close modal when clicking outside
        calendarModal.addEventListener('click', function(event) {
            if (event.target === calendarModal) {
                closeCalendarModal();
            }
        });
    }
    
    function closeCalendarModal() {
        calendarModal.style.opacity = '0';
        setTimeout(() => {
            calendarModal.style.display = 'none';
        }, 300);
    }
    
    // Calendar Initialization
    if (document.getElementById('calendar')) {
        initializeCalendar();
    }
    
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        const today = new Date();
        
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events.map(event => ({
                title: event.title,
                start: event.date,
                allDay: true,
                backgroundColor: getPetColor(event.pet_id),
                extendedProps: {
                    description: event.description,
                    icon: event.icon,
                    eventIndex: event.id
                }
            })),
            eventClick: function(info) {
                showEventDetails(info.event.extendedProps.eventIndex);
            },
            dateClick: function(info) {
                // Prefill event form with selected date
                openEventModal();
                document.getElementById('event-date').value = info.dateStr;
            }
        });
        
        calendar.render();
    }
    
    function getPetColor(petId) {
        // Return color based on pet id or default color
        const petColors = {
            'dog': '#4CAF50',
            'cat': '#2196F3',
            'bird': '#FF9800',
            'rabbit': '#9C27B0',
            'default': '#3788d8'
        };
        
        const pet = pets.find(p => p.id === petId);
        return pet ? petColors[pet.type] || petColors.default : petColors.default;
    }
    
    // Create Event Modal
    const eventModal = document.getElementById('eventModal');
    const createEventBtn = document.getElementById('createEventBtn');
    const createEventBtnEmpty = document.getElementById('createEventBtnEmpty');
    const closeEventBtn = document.querySelector('.close-modal-event');
    const cancelEventBtn = document.getElementById('cancelEvent');
    const eventForm = document.getElementById('eventForm');
    
    if (eventModal) {
        // Open event modal from main button
        if (createEventBtn) {
            createEventBtn.addEventListener('click', openEventModal);
        }
        
        // Open event modal from empty state button
        if (createEventBtnEmpty) {
            createEventBtnEmpty.addEventListener('click', openEventModal);
        }
        
        // Close event modal with X button
        if (closeEventBtn) {
            closeEventBtn.addEventListener('click', closeEventModal);
        }
        
        // Close event modal with Cancel button
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', closeEventModal);
        }
        
        // Close modal when clicking outside
        eventModal.addEventListener('click', function(event) {
            if (event.target === eventModal) {
                closeEventModal();
            }
        });
        
        // Submit event form
        if (eventForm) {
            eventForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveEvent();
            });
        }
        
        // Initialize edit and delete event buttons
        initializeEventButtons();
    }
    
    function initializeEventButtons() {
        // Edit event buttons
        const editEventBtns = document.querySelectorAll('.edit-event');
        editEventBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const eventIndex = this.getAttribute('data-id');
                openEditEventModal(eventIndex);
            });
        });
        
        // Delete event buttons
        const deleteEventBtns = document.querySelectorAll('.delete-event');
        deleteEventBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const eventIndex = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this event?')) {
                    deleteEvent(eventIndex);
                }
            });
        });
    }
    
    function openEventModal() {
        // Reset form
        if (eventForm) {
            eventForm.reset();
            document.getElementById('event-index').value = '-1';
        }
        
        // Populate pet dropdown
        populatePetDropdown();
        
        eventModal.style.display = 'flex';
        setTimeout(() => {
            eventModal.style.opacity = '1';
        }, 10);
    }
    
    function populatePetDropdown() {
        const petDropdown = document.getElementById('event-pet');
        if (petDropdown) {
            // Clear existing options
            while (petDropdown.options.length > 1) {
                petDropdown.remove(1);
            }
            
            // Add each pet as an option
            pets.forEach(pet => {
                const option = document.createElement('option');
                option.value = pet.id;
                option.textContent = pet.name;
                petDropdown.appendChild(option);
            });
        }
    }
    
    function openEditEventModal(eventIndex) {
        const event = events.find(e => e.id.toString() === eventIndex);
        
        if (event) {
            // Populate form fields
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-pet').value = event.pet_id;
            document.getElementById('event-icon').value = event.icon;
            document.getElementById('event-description').value = event.description;
            document.getElementById('event-index').value = eventIndex;
            
            // Populate pet dropdown
            populatePetDropdown();
        }
        
        // Show modal
        eventModal.style.display = 'flex';
        setTimeout(() => {
            eventModal.style.opacity = '1';
        }, 10);
    }
    
    function closeEventModal() {
        eventModal.style.opacity = '0';
        setTimeout(() => {
            eventModal.style.display = 'none';
        }, 300);
    }
    
    function saveEvent() {
        const eventIndex = document.getElementById('event-index').value;
        const eventTitle = document.getElementById('event-title').value;
        const eventDate = document.getElementById('event-date').value;
        const eventPet = document.getElementById('event-pet').value;
        const eventIcon = document.getElementById('event-icon').value;
        const eventDescription = document.getElementById('event-description').value;
        
        const eventData = {
            title: eventTitle,
            date: eventDate,
            pet_id: eventPet,
            icon: eventIcon,
            description: eventDescription
        };
        
        if (eventIndex === '-1') {
            // New event
            eventData.id = Date.now().toString();
            events.push(eventData);
        } else {
            // Update existing event
            const index = events.findIndex(e => e.id.toString() === eventIndex);
            if (index !== -1) {
                eventData.id = eventIndex;
                events[index] = eventData;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('petEvents', JSON.stringify(events));
        
        // Update UI
        updateEventsUI();
        
        // Close modal
        closeEventModal();
        
        // Show success message
        showNotification('Event saved successfully!', 'success');
        
        // Refresh calendar if it exists
        if (document.getElementById('calendar')) {
            initializeCalendar();
        }
    }
    
    function deleteEvent(eventIndex) {
        // Find and remove the event
        const index = events.findIndex(e => e.id.toString() === eventIndex);
        if (index !== -1) {
            events.splice(index, 1);
            
            // Save to localStorage
            localStorage.setItem('petEvents', JSON.stringify(events));
            
            // Update UI with animation
            const eventCard = document.querySelector(`.delete-event[data-id="${eventIndex}"]`).closest('.event-card');
            
            // Add fade-out animation
            eventCard.style.opacity = '0';
            eventCard.style.transform = 'scale(0.8)';
            
            // Remove from DOM after animation and update UI
            setTimeout(() => {
                eventCard.remove();
                updateEventsUI();
                
                // Refresh calendar if it exists
                if (document.getElementById('calendar')) {
                    initializeCalendar();
                }
                
                // Show success message
                showNotification('Event deleted successfully!', 'success');
            }, 300);
        }
    }
    
    function updateEventsUI() {
        const eventsContainer = document.querySelector('.events-container');
        if (!eventsContainer) return;
        
        if (events.length === 0) {
            // Show empty state
            eventsContainer.innerHTML = `
                <div class="no-events">
                    <p>No upcoming events. Create your first pet care event!</p>
                    <button id="createEventBtnEmpty" class="btn secondary">Create Event</button>
                </div>
            `;
            
            // Add event listener to the new button
            document.getElementById('createEventBtnEmpty').addEventListener('click', openEventModal);
        } else {
            // Sort events by date (newest first)
            const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Only show upcoming events (from today forward)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= today);
            
            // Generate HTML for events
            let eventsHTML = '';
            
            upcomingEvents.forEach(event => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                const pet = pets.find(p => p.id === event.pet_id);
                const petName = pet ? pet.name : 'All Pets';
                
                eventsHTML += `
                    <div class="event-card">
                        <div class="event-icon">
                            <i class="${event.icon}"></i>
                        </div>
                        <div class="event-details">
                            <h3>${event.title}</h3>
                            <p class="event-date">${formattedDate}</p>
                            <p class="event-pet">Pet: ${petName}</p>
                            <p class="event-description">${event.description}</p>
                        </div>
                        <div class="event-actions">
                            <button class="edit-event" data-id="${event.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-event" data-id="${event.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            // Update container
            eventsContainer.innerHTML = eventsHTML;
            
            // Reinitialize buttons
            initializeEventButtons();
        }
    }
    
    function showEventDetails(eventIndex) {
        const event = events.find(e => e.id.toString() === eventIndex);
        
        if (event) {
            const eventDetailsModal = document.getElementById('eventDetailsModal') || createEventDetailsModal();
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const pet = pets.find(p => p.id === event.pet_id);
            const petName = pet ? pet.name : 'All Pets';
            
            // Update modal content
            eventDetailsModal.querySelector('.event-details-title').textContent = event.title;
            eventDetailsModal.querySelector('.event-details-date').textContent = formattedDate;
            eventDetailsModal.querySelector('.event-details-pet').textContent = `Pet: ${petName}`;
            eventDetailsModal.querySelector('.event-details-description').textContent = event.description;
            eventDetailsModal.querySelector('.event-details-icon i').className = event.icon;
            
            // Set up edit button
            eventDetailsModal.querySelector('.edit-event-details').setAttribute('data-id', event.id);
            
            // Set up delete button
            eventDetailsModal.querySelector('.delete-event-details').setAttribute('data-id', event.id);
            
            // Show modal
            eventDetailsModal.style.display = 'flex';
            setTimeout(() => {
                eventDetailsModal.style.opacity = '1';
            }, 10);
        }
    }
    
    function createEventDetailsModal() {
        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'eventDetailsModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.style.opacity = '0';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal close-details-modal">&times;</span>
                <div class="event-details-container">
                    <div class="event-details-icon">
                        <i class=""></i>
                    </div>
                    <h2 class="event-details-title"></h2>
                    <p class="event-details-date"></p>
                    <p class="event-details-pet"></p>
                    <p class="event-details-description"></p>
                    <div class="event-details-actions">
                        <button class="btn primary edit-event-details">Edit</button>
                        <button class="btn danger delete-event-details">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up close button
        const closeBtn = modal.querySelector('.close-details-modal');
        closeBtn.addEventListener('click', function() {
            closeEventDetailsModal();
        });
        
        // Close when clicking outside
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeEventDetailsModal();
            }
        });
        
        // Set up edit button
        const editBtn = modal.querySelector('.edit-event-details');
        editBtn.addEventListener('click', function() {
            const eventIndex = this.getAttribute('data-id');
            closeEventDetailsModal();
            openEditEventModal(eventIndex);
        });
        
        // Set up delete button
        const deleteBtn = modal.querySelector('.delete-event-details');
        deleteBtn.addEventListener('click', function() {
            const eventIndex = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this event?')) {
                closeEventDetailsModal();
                deleteEvent(eventIndex);
            }
        });
        
        return modal;
    }
    
    function closeEventDetailsModal() {
        const modal = document.getElementById('eventDetailsModal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
    
    // Schedule Generator
    const scheduleForm = document.getElementById('scheduleForm');
    const generateBtn = document.getElementById('generateScheduleBtn');
    const scheduleOutput = document.getElementById('scheduleOutput');
    const loadingContainer = document.querySelector('.loading-container');
    const copyScheduleBtn = document.getElementById('copyScheduleBtn');
    const saveScheduleBtn = document.getElementById('saveScheduleBtn');
    
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading spinner
            if (loadingContainer) {
                loadingContainer.style.display = 'flex';
            }
            
            // Collect form data
            const formData = new FormData(scheduleForm);
            const scheduleData = {
                date: formData.get('date'),
                wakeTime: formData.get('wakeTime'),
                sleepTime: formData.get('sleepTime'),
                homeTimes: formData.get('homeTimes'),
                outsideTimes: formData.get('outsideTimes'),
                activities: formData.get('activities')
            };
            
            // Simulate API call with timeout
            setTimeout(() => {
                generateSchedule(scheduleData);
                
                // Hide loading spinner
                if (loadingContainer) {
                    loadingContainer.style.display = 'none';
                }
                
                // Show copy and save buttons
                if (copyScheduleBtn) {
                    copyScheduleBtn.style.display = 'inline-block';
                }
                if (saveScheduleBtn) {
                    saveScheduleBtn.style.display = 'inline-block';
                }
            }, 2000);
        });
    }
    
    // Copy schedule to clipboard
    if (copyScheduleBtn) {
        copyScheduleBtn.addEventListener('click', function() {
            if (scheduleOutput) {
                scheduleOutput.select();
                document.execCommand('copy');
                showNotification('Schedule copied to clipboard!', 'success');
            }
        });
    }
    
    // Save schedule as event
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', function() {
            if (scheduleOutput && scheduleOutput.value) {
                // Open event modal
                openEventModal();
                
                // Pre-fill form with schedule data
                document.getElementById('event-title').value = 'Daily Pet Care Schedule';
                document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('event-icon').value = 'fas fa-calendar-check';
                document.getElementById('event-description').value = scheduleOutput.value;
            }
        });
    }
    
    function generateSchedule(data) {
        // Get user's pets
        const userPets = pets.length > 0 ? pets : generateSamplePets();
        
        let scheduleText = `📅 Pet Care Schedule for ${data.date}\n\n`;
        scheduleText += `🌅 Wake up: ${data.wakeTime}\n`;
        scheduleText += `🌙 Bedtime: ${data.sleepTime}\n\n`;
        
        scheduleText += `⏰ MORNING ROUTINE\n`;
        
        // Morning feeding for all pets
        const morningTime = getTimeFromString(data.wakeTime, 30);
        scheduleText += `- ${morningTime}: Morning feeding for all pets\n`;
        
        // Add pet-specific morning activities
        userPets.forEach(pet => {
            if (pet.type === 'dog') {
                const walkTime = getTimeFromString(data.wakeTime, 60);
                scheduleText += `- ${walkTime}: Morning walk for ${pet.name} (15-20 minutes)\n`;
            } else if (pet.type === 'cat') {
                const litterTime = getTimeFromString(data.wakeTime, 45);
                scheduleText += `- ${litterTime}: Clean ${pet.name}'s litter box\n`;
            } else if (pet.type === 'bird') {
                const cageTime = getTimeFromString(data.wakeTime, 15);
                scheduleText += `- ${cageTime}: Uncover ${pet.name}'s cage, refresh water\n`;
            }
        });
        
        scheduleText += `\n⏰ DURING THE DAY (WHEN YOU'RE AWAY: ${data.outsideTimes})\n`;
        scheduleText += `- Make sure fresh water is available for all pets\n`;
        scheduleText += `- Leave toys accessible\n`;
        scheduleText += `- Ensure comfortable resting areas are available\n`;
        
        // Add pet-specific daytime needs
        userPets.forEach(pet => {
            if (pet.type === 'dog' && data.outsideTimes.includes('4+')) {
                scheduleText += `- Consider arranging a midday dog walker for ${pet.name}\n`;
            } else if (pet.type === 'cat') {
                scheduleText += `- Leave a window perch accessible for ${pet.name}\n`;
            }
        });
        
        scheduleText += `\n⏰ EVENING ROUTINE (WHEN YOU'RE HOME: ${data.homeTimes})\n`;
        
        // Evening feeding
        const eveningFeedTime = getTimeFromString(data.sleepTime, -180); // 3 hours before bedtime
        scheduleText += `- ${eveningFeedTime}: Evening feeding for all pets\n`;
        
        // Add pet-specific evening activities
        userPets.forEach(pet => {
            if (pet.type === 'dog') {
                const eveningWalkTime = getTimeFromString(data.sleepTime, -120);
                scheduleText += `- ${eveningWalkTime}: Evening walk for ${pet.name} (20-30 minutes)\n`;
            } else if (pet.type === 'bird') {
                const cageTime = getTimeFromString(data.sleepTime, -60);
                scheduleText += `- ${cageTime}: Cover ${pet.name}'s cage for the night\n`;
            }
        });
        
        // Playtime for all
        const playtime = getTimeFromString(data.sleepTime, -150);
        scheduleText += `- ${playtime}: Playtime and bonding with all pets\n`;
        
        // Add any special activities
        if (data.activities) {
            scheduleText += `\n⭐ SPECIAL ACTIVITIES\n`;
            scheduleText += `- ${data.activities}\n`;
        }
        
        scheduleText += `\n⚠️ REMINDERS\n`;
        scheduleText += `- Check water bowls regularly\n`;
        scheduleText += `- Monitor for any signs of distress or illness\n`;
        scheduleText += `- Ensure all pets have had bathroom breaks before bedtime\n`;
        
        // Pet-specific reminders
        userPets.forEach(pet => {
            if (pet.type === 'dog') {
                scheduleText += `- Check ${pet.name}'s paws after walks\n`;
            } else if (pet.type === 'cat') {
                scheduleText += `- Check ${pet.name}'s litter box before bed\n`;
            } else if (pet.type === 'bird') {
                scheduleText += `- Ensure ${pet.name}'s cage is clean\n`;
            } else if (pet.type === 'rabbit') {
                scheduleText += `- Refresh ${pet.name}'s hay supply\n`;
            }
        });
        
        // Update the output textarea
        if (scheduleOutput) {
            scheduleOutput.value = scheduleText;
        }
    }
    
    function getTimeFromString(timeStr, offsetMinutes) {
        // Parse time string (format: "HH:MM AM/PM")
        const timeRegex = /(\d+):(\d+)\s*(AM|PM)/i;
        const match = timeStr.match(timeRegex);
        
        if (!match) return timeStr; // Return original if format doesn't match
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Create date object for easier manipulation
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        
        // Apply offset
        date.setMinutes(date.getMinutes() + offsetMinutes);
        
        // Format back to 12-hour time
        let newHours = date.getHours();
        const newMinutes = date.getMinutes();
        const newPeriod = newHours >= 12 ? 'PM' : 'AM';
        
        // Convert back to 12-hour format
        newHours = newHours % 12;
        if (newHours === 0) newHours = 12;
        
        // Format with leading zeros
        const formattedMinutes = newMinutes.toString().padStart(2, '0');
        
        return `${newHours}:${formattedMinutes} ${newPeriod}`;
    }
    
    function generateSamplePets() {
        return [
            { id: 'sample1', name: 'Max', type: 'dog', breed: 'Labrador' },
            { id: 'sample2', name: 'Whiskers', type: 'cat', breed: 'Tabby' }
        ];
    }
    
    // Pet Management
    const petForm = document.getElementById('petForm');
    const addPetBtn = document.getElementById('addPetBtn');
    const petModal = document.getElementById('petModal');
    const closePetBtn = document.querySelector('.close-modal-pet');
    const cancelPetBtn = document.getElementById('cancelPet');
    
    if (addPetBtn && petModal) {
        addPetBtn.addEventListener('click', openPetModal);
        
        if (closePetBtn) {
            closePetBtn.addEventListener('click', closePetModal);
        }
        
        if (cancelPetBtn) {
            cancelPetBtn.addEventListener('click', closePetModal);
        }
        
        // Close modal when clicking outside
        petModal.addEventListener('click', function(event) {
            if (event.target === petModal) {
                closePetModal();
            }
        });
        
        // Submit pet form
        if (petForm) {
            petForm.addEventListener('submit', function(e) {
                e.preventDefault();
                savePet();
            });
        }
    }
    
    function openPetModal() {
        // Reset form
        if (petForm) {
            petForm.reset();
            document.getElementById('pet-index').value = '-1';
            
            // Reset pet image preview
            const previewImg = document.getElementById('pet-image-preview');
            if (previewImg) {
                previewImg.src = 'img/default-pet.png';
                previewImg.style.display = 'block';
            }
        }
        
        petModal.style.display = 'flex';
        setTimeout(() => {
            petModal.style.opacity = '1';
        }, 10);
    }
    
    function closePetModal() {
        petModal.style.opacity = '0';
        setTimeout(() => {
            petModal.style.display = 'none';
        }, 300);
    }
    
    // Handle pet image uploads
    const petImageInput = document.getElementById('pet-image');
    if (petImageInput) {
        petImageInput.addEventListener('change', function() {
            const previewImg = document.getElementById('pet-image-preview');
            
            if (this.files && this.files[0] && previewImg) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    function savePet() {
        const petIndex = document.getElementById('pet-index').value;
        const petName = document.getElementById('pet-name').value;
        const petType = document.getElementById('pet-type').value;
        const petBreed = document.getElementById('pet-breed').value;
        const petAge = document.getElementById('pet-age').value;
        const petWeight = document.getElementById('pet-weight').value;
        
        // Get image if it exists
        let petImage = 'img/default-pet.png';
        const imagePreview = document.getElementById('pet-image-preview');
        if (imagePreview && imagePreview.src && !imagePreview.src.endsWith('default-pet.png')) {
            petImage = imagePreview.src;
        }
        
        const petData = {
            name: petName,
            type: petType,
            breed: petBreed,
            age: petAge,
            weight: petWeight,
            image: petImage
        };
        
        if (petIndex === '-1') {
            // New pet
            petData.id = Date.now().toString();
            pets.push(petData);
        } else {
            // Update existing pet
            const index = pets.findIndex(p => p.id.toString() === petIndex);
            if (index !== -1) {
                petData.id = petIndex;
                pets[index] = petData;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('pets', JSON.stringify(pets));
        
        // Update UI
        updatePetsUI();
        
        // Close modal
        closePetModal();
        
        // Show success message
        showNotification('Pet saved successfully!', 'success');
    }
    
    function updatePetsUI() {
        const petsContainer = document.querySelector('.pets-container');
        if (!petsContainer) return;
        
        if (pets.length === 0) {
            // Show empty state
            petsContainer.innerHTML = `
                <div class="no-pets">
                    <p>No pets added yet. Add your first pet!</p>
                    <button id="addPetBtnEmpty" class="btn primary">Add Pet</button>
                </div>
            `;
            
            // Add event listener to the new button
            // Add event listener to the new button
            document.getElementById('addPetBtnEmpty').addEventListener('click', openPetModal);
        } else {
            // Generate HTML for pets
            let petsHTML = '';
            
            pets.forEach(pet => {
                // Calculate age display (convert to years/months as appropriate)
                let ageDisplay = pet.age;
                if (pet.age && !isNaN(pet.age)) {
                    if (pet.age < 12) {
                        ageDisplay = `${pet.age} month${pet.age === 1 ? '' : 's'}`;
                    } else {
                        const years = Math.floor(pet.age / 12);
                        const months = pet.age % 12;
                        ageDisplay = `${years} year${years === 1 ? '' : 's'}`;
                        if (months > 0) {
                            ageDisplay += `, ${months} month${months === 1 ? '' : 's'}`;
                        }
                    }
                }
                
                // Generate schedule items based on pet type
                let scheduleItems = '';
                
                if (pet.type === 'dog') {
                    scheduleItems = `
                        <div class="schedule-item"><i class="fas fa-bone"></i> Feeding: 2-3 times daily</div>
                        <div class="schedule-item"><i class="fas fa-walking"></i> Walks: 2-3 times daily</div>
                        <div class="schedule-item"><i class="fas fa-shower"></i> Grooming: Weekly</div>
                    `;
                } else if (pet.type === 'cat') {
                    scheduleItems = `
                        <div class="schedule-item"><i class="fas fa-fish"></i> Feeding: 2 times daily</div>
                        <div class="schedule-item"><i class="fas fa-toilet"></i> Litter: Clean daily</div>
                        <div class="schedule-item"><i class="fas fa-shower"></i> Grooming: Weekly</div>
                    `;
                } else if (pet.type === 'bird') {
                    scheduleItems = `
                        <div class="schedule-item"><i class="fas fa-seedling"></i> Feeding: 1-2 times daily</div>
                        <div class="schedule-item"><i class="fas fa-broom"></i> Cage Clean: Weekly</div>
                        <div class="schedule-item"><i class="fas fa-tint"></i> Water: Refresh daily</div>
                    `;
                } else if (pet.type === 'rabbit') {
                    scheduleItems = `
                        <div class="schedule-item"><i class="fas fa-carrot"></i> Feeding: 2 times daily</div>
                        <div class="schedule-item"><i class="fas fa-broom"></i> Cage Clean: Every 2-3 days</div>
                        <div class="schedule-item"><i class="fas fa-tint"></i> Water: Refresh daily</div>
                    `;
                } else {
                    scheduleItems = `
                        <div class="schedule-item"><i class="fas fa-utensils"></i> Feeding: Daily</div>
                        <div class="schedule-item"><i class="fas fa-home"></i> Habitat Clean: Regular</div>
                        <div class="schedule-item"><i class="fas fa-tint"></i> Water: Refresh regularly</div>
                    `;
                }
                
                petsHTML += `
                    <div class="pet-card">
                        <div class="pet-image-container">
                            <img src="${pet.image}" alt="${pet.name}" class="pet-image">
                        </div>
                        <div class="pet-info">
                            <h3>${pet.name}</h3>
                            <p class="pet-type">${capitalizeFirstLetter(pet.type)}${pet.breed ? ` • ${pet.breed}` : ''}</p>
                            <p class="pet-stats">
                                ${ageDisplay ? `<span><i class="fas fa-birthday-cake"></i> ${ageDisplay}</span>` : ''}
                                ${pet.weight ? `<span><i class="fas fa-weight"></i> ${pet.weight} lbs</span>` : ''}
                            </p>
                            <div class="pet-schedule">
                                <h4>Care Schedule</h4>
                                ${scheduleItems}
                            </div>
                        </div>
                        <div class="pet-actions">
                            <button class="edit-pet" data-id="${pet.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-pet" data-id="${pet.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            // Update container
            petsContainer.innerHTML = petsHTML;
            
            // Initialize edit and delete buttons
            initializePetButtons();
        }
    }
    
    function initializePetButtons() {
        // Edit pet buttons
        const editPetBtns = document.querySelectorAll('.edit-pet');
        editPetBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const petIndex = this.getAttribute('data-id');
                openEditPetModal(petIndex);
            });
        });
        
        // Delete pet buttons
        const deletePetBtns = document.querySelectorAll('.delete-pet');
        deletePetBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const petIndex = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this pet?')) {
                    deletePet(petIndex);
                }
            });
        });
    }
    
    function openEditPetModal(petIndex) {
        const pet = pets.find(p => p.id.toString() === petIndex);
        
        if (pet) {
            // Populate form fields
            document.getElementById('pet-name').value = pet.name;
            document.getElementById('pet-type').value = pet.type;
            document.getElementById('pet-breed').value = pet.breed || '';
            document.getElementById('pet-age').value = pet.age || '';
            document.getElementById('pet-weight').value = pet.weight || '';
            document.getElementById('pet-index').value = petIndex;
            
            // Update image preview
            const previewImg = document.getElementById('pet-image-preview');
            if (previewImg && pet.image) {
                previewImg.src = pet.image;
                previewImg.style.display = 'block';
            }
        }
        
        // Show modal
        petModal.style.display = 'flex';
        setTimeout(() => {
            petModal.style.opacity = '1';
        }, 10);
    }
    
    function deletePet(petIndex) {
        // Find and remove the pet
        const index = pets.findIndex(p => p.id.toString() === petIndex);
        if (index !== -1) {
            pets.splice(index, 1);
            
            // Save to localStorage
            localStorage.setItem('pets', JSON.stringify(pets));
            
            // Update UI with animation
            const petCard = document.querySelector(`.delete-pet[data-id="${petIndex}"]`).closest('.pet-card');
            
            // Add fade-out animation
            petCard.style.opacity = '0';
            petCard.style.transform = 'scale(0.8)';
            
            // Remove from DOM after animation and update UI
            setTimeout(() => {
                petCard.remove();
                updatePetsUI();
                
                // Show success message
                showNotification('Pet deleted successfully!', 'success');
                
                // Also update event dropdown if it exists (since pet options might have changed)
                populatePetDropdown();
            }, 300);
        }
    }
    
    // Reminder System
    function initializeReminderSystem() {
        // Check for pending reminders on load
        checkReminders();
        
        // Set interval to check reminders every minute
        setInterval(checkReminders, 60000);
    }
    
    function checkReminders() {
        // Get today's events
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const todayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const eventDateStr = eventDate.toISOString().split('T')[0];
            return eventDateStr === todayStr;
        });
        
        // Check if we need to show notifications for today's events
        if (todayEvents.length > 0) {
            const notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents') || '[]');
            
            todayEvents.forEach(event => {
                // Skip if we've already notified for this event today
                if (notifiedEvents.includes(event.id)) return;
                
                // Add to notified list
                notifiedEvents.push(event.id);
                localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
                
                // Show notification
                showSystemNotification(`Pet Care Reminder: ${event.title}`, {
                    body: `Don't forget: ${event.description}`,
                    icon: '/img/favicon.png'
                });
            });
        }
        
        // Reset notified events at midnight
        const lastReset = localStorage.getItem('lastNotificationReset');
        const todayDateStr = today.toISOString().split('T')[0];
        
        if (lastReset !== todayDateStr) {
            localStorage.setItem('notifiedEvents', '[]');
            localStorage.setItem('lastNotificationReset', todayDateStr);
        }
    }
    
    function showSystemNotification(title, options) {
        // Check if browser supports notifications
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }
        
        // Check if permission is already granted
        if (Notification.permission === "granted") {
            new Notification(title, options);
        }
        // Otherwise, request permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    new Notification(title, options);
                }
            });
        }
    }
    
    // User Stats and Achievements
    function updateUserStats() {
        const statItems = document.querySelectorAll('.stat-item');
        if (statItems.length === 0) return;
        
        // Calculate stats
        const totalPets = pets.length;
        const totalEvents = events.length;
        const completedEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            return eventDate < today;
        }).length;
        
        // Upcoming events in the next 7 days
        const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            return eventDate >= today && eventDate <= nextWeek;
        }).length;
        
        // Update stats display
        const statsMap = {
            'pets-count': totalPets,
            'events-count': totalEvents,
            'completed-count': completedEvents,
            'upcoming-count': upcomingEvents
        };
        
        for (const [id, value] of Object.entries(statsMap)) {
            const statItem = document.getElementById(id);
            if (statItem) {
                statItem.textContent = value;
            }
        }
        
        // Check for achievements
        checkAchievements(statsMap);
    }
    
    function checkAchievements(stats) {
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        let newAchievements = [];
        
        // Define possible achievements
        const possibleAchievements = [
            { id: 'first-pet', title: 'Pet Parent', description: 'Added your first pet', condition: stats['pets-count'] >= 1 },
            { id: 'multiple-pets', title: 'Full House', description: 'Taking care of multiple pets', condition: stats['pets-count'] >= 3 },
            { id: 'first-event', title: 'Organized', description: 'Created your first pet care event', condition: stats['events-count'] >= 1 },
            { id: 'active-planner', title: 'Active Planner', description: 'Created 5+ pet care events', condition: stats['events-count'] >= 5 },
            { id: 'task-master', title: 'Task Master', description: 'Completed 10+ pet care tasks', condition: stats['completed-count'] >= 10 }
        ];
        
        // Check each achievement
        possibleAchievements.forEach(achievement => {
            if (achievement.condition && !achievements.find(a => a.id === achievement.id)) {
                achievements.push(achievement);
                newAchievements.push(achievement);
            }
        });
        
        // Save updated achievements
        localStorage.setItem('achievements', JSON.stringify(achievements));
        
        // Show notifications for new achievements
        if (newAchievements.length > 0) {
            newAchievements.forEach(achievement => {
                showNotification(`Achievement Unlocked: ${achievement.title}!`, 'achievement');
            });
            
            // Update achievements UI if it exists
            updateAchievementsUI();
        }
    }
    
    function updateAchievementsUI() {
        const achievementsContainer = document.querySelector('.achievements-container');
        if (!achievementsContainer) return;
        
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        
        if (achievements.length === 0) {
            achievementsContainer.innerHTML = `
                <div class="no-achievements">
                    <p>No achievements yet. Keep using PetPal to unlock achievements!</p>
                </div>
            `;
        } else {
            let achievementsHTML = '';
            
            achievements.forEach(achievement => {
                achievementsHTML += `
                    <div class="achievement-card">
                        <div class="achievement-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="achievement-details">
                            <h3>${achievement.title}</h3>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `;
            });
            
            achievementsContainer.innerHTML = achievementsHTML;
        }
    }
    
    // Notification System
    function showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.style.display = 'block';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            // Remove after animation
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
    
    // Theme Switcher
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (themeSwitcher) {
        // Set initial theme based on localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeSwitcher.checked = savedTheme === 'dark';
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            themeSwitcher.checked = prefersDark;
        }
        
        // Handle theme toggle
        themeSwitcher.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add animation effect
            document.documentElement.classList.add('theme-transition');
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 300);
        });
    }
    
    // Helper functions
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Initialize everything
    function initializeApp() {
        // Update UI elements
        updateEventsUI();
        updatePetsUI();
        updateUserStats();
        updateAchievementsUI();
        
        // Initialize reminder system
        initializeReminderSystem();
        
        // Add hover animations to user stats
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.05)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
        
        // Add hover animations to pet cards
        const petCards = document.querySelectorAll('.pets-container .pet-card');
        petCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                // Scale up and add shadow to the pet image
                const image = this.querySelector('.pet-image');
                if (image) {
                    image.style.transform = 'scale(1.03)';
                }
                
                // Add glow effect to schedule icons
                const icons = this.querySelectorAll('.schedule-item i');
                icons.forEach(icon => {
                    icon.style.transform = 'scale(1.2)';
                    icon.style.color = 'var(--primary-dark)';
                });
            });
            
            card.addEventListener('mouseleave', function() {
                // Reset styles
                const image = this.querySelector('.pet-image');
                if (image) {
                    image.style.transform = '';
                }
                
                // Reset icon styles
                const icons = this.querySelectorAll('.schedule-item i');
                icons.forEach(icon => {
                    icon.style.transform = '';
                    icon.style.color = '';
                });
            });
        });
    }
    
    // Call the initializer
    initializeApp();
});