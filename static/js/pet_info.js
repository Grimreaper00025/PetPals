document.addEventListener('DOMContentLoaded', function() {
    // Get pet type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const petType = urlParams.get('pet_type');
    
    // Set pet type in the hidden field
    document.getElementById('pet_type').value = petType;
    
    // Update the UI with the pet type
    const petTypeSpan = document.getElementById('petType');
    const petIcon = document.getElementById('petIcon');
    
    if (petType) {
        // Set pet type text
        petTypeSpan.textContent = petType.charAt(0).toUpperCase() + petType.slice(1);
        
        // Update icon based on pet type
        updatePetIcon(petType);
        
    }
    
    // Add animation to the form inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select');
    inputs.forEach((input, index) => {
        // Add staggered animation
        input.style.opacity = '0';
        input.style.transform = 'translateY(20px)';
        input.style.transition = `all 0.5s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            input.style.opacity = '1';
            input.style.transform = 'translateY(0)';
        }, 100);
        
        // Add focus animation
        input.addEventListener('focus', () => {
            inputs.forEach(i => {
                if (i !== input) {
                    i.style.opacity = '0.7';
                }
            });
        });
        
        input.addEventListener('blur', () => {
            inputs.forEach(i => {
                i.style.opacity = '1';
            });
        });
    });
    
    // Background animation enhancements
    createParticles();
    
    // Form validation
    const petInfoForm = document.getElementById('petInfoForm');
    petInfoForm.addEventListener('submit', function(e) {
        const petName = document.getElementById('pet_name').value;
        const petBreed = document.getElementById('pet_breed').value;
        const petAge = document.getElementById('pet_age').value;
        
        if (!petName || !petBreed || !petAge) {
            e.preventDefault();
            showValidationError();
        } else {
            // Show loading animation
            addLoadingAnimation();
        }
    });
    
    // Functions
    function updatePetIcon(petType) {
        const iconClass = getPetIconClass(petType);
        petIcon.className = iconClass;
        
        // Update avatar container color based on pet type
        const avatarContainer = document.querySelector('.avatar-container');
        const colors = {
            'dog': '#6c63ff',
            'cat': '#ff6584',
            'bird': '#4CAF50',
            'fish': '#03A9F4',
            'rabbit':'#FF9800',
            'horse': '#8BC34A',
            'ferret': '#FF5722',
        };
        
        if (colors[petType]) {
            avatarContainer.style.backgroundColor = colors[petType];
        }
    }
    
    function getPetIconClass(petType) {
        const iconMap = {
            'dog': 'fas fa-dog',
            'cat': 'fas fa-cat',
            'bird': 'fas fa-dove',
            'fish': 'fas fa-fish',
            'rabbit': 'fa-solid fa-carrot',
            'horse': 'fas fa-horse',
            'ferret': 'fas fa-otter'
        };
        
        return iconMap[petType] || 'fa-solid fa-paw';
    }
    
    function loadBreeds(petType) {
        fetch(`/get_breeds/${petType}`)
            .then(response => response.json())
            .then(breeds => {
                const breedSelect = document.getElementById('pet_breed');
                breedSelect.innerHTML = '<option value="">Select breed</option>';
                
                breeds.forEach(breed => {
                    const option = document.createElement('option');
                    option.value = breed;
                    option.textContent = breed;
                    breedSelect.appendChild(option);
                });
                
                // Add animation to the select dropdown
                setTimeout(() => {
                    breedSelect.classList.add('loaded');
                }, 300);
            })
            .catch(error => console.error('Error loading breeds:', error));
    }
    
    function createParticles() {
        const container = document.querySelector('.background-animation');
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Create random paw prints
            particle.innerHTML = '<i class="fas fa-paw"></i>';
            particle.style.position = 'absolute';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = '0.1';
            particle.style.fontSize = `${Math.random() * 20 + 10}px`;
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            particle.style.color = getRandomColor(0.3);
            particle.style.animation = `float ${Math.random() * 10 + 20}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(particle);
        }
    }
    
    function getRandomColor(opacity) {
        const colors = [
            `rgba(108, 99, 255, ${opacity})`,
            `rgba(255, 101, 132, ${opacity})`,
            `rgba(255, 221, 100, ${opacity})`,
            `rgba(102, 204, 153, ${opacity})`
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function showValidationError() {
        const formContainer = document.querySelector('.container');
        formContainer.classList.add('shake');
        
        setTimeout(() => {
            formContainer.classList.remove('shake');
        }, 500);
    }
    
    function addLoadingAnimation() {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
    }
    
    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s;
        }
        
        .loaded option {
            animation: fadeIn 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
});