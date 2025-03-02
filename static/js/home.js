document.addEventListener('DOMContentLoaded', function() {
    // Pet selection cards
    const petCards = document.querySelectorAll('.pet-card');
    const modal = document.getElementById('petModal');
    const selectedPetSpan = document.getElementById('selectedPet');
    const closeButton = document.querySelector('.close-button');
    const continueButton = document.getElementById('continueButton');
    const cancelButton = document.getElementById('cancelButton');
    
    let selectedPetType = null;
    
    // Background bubbles animation
    const bubbles = document.querySelectorAll('.bubble');
    animateBubbles();
    
    function animateBubbles() {
        bubbles.forEach(bubble => {
            // Random positions
            const startX = Math.random() * 100;
            const startY = Math.random() * 50 + 25;
            
            bubble.style.left = `${startX}%`;
            bubble.style.top = `${startY}%`;
        });
    }
    
    // Add hover animations to pet cards
    petCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
        
        // Add click event for pet selection
        card.addEventListener('click', () => {
            selectedPetType = card.getAttribute('data-pet');
            selectedPetSpan.textContent = selectedPetType.charAt(0).toUpperCase() + selectedPetType.slice(1);
            
            // Show the modal with animation
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            
            // Add selected style to the clicked card
            petCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // Apply a pulse animation
            card.style.animation = 'pulse 0.6s';
            setTimeout(() => {
                card.style.animation = '';
            }, 600);
        });
    });
    
    // Modal control
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Remove selected styles
        petCards.forEach(card => card.classList.remove('selected'));
    }
    
    // When continue is clicked, redirect to pet info page
    continueButton.addEventListener('click', () => {
        if (selectedPetType) {
            window.location.href = `/pet_info?pet_type=${selectedPetType}`;
        }
    });
    
    // Click outside to close modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Add some particles animation
    createParticles();
    
    function createParticles() {
        const container = document.querySelector('.background-animation');
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random styling
            particle.style.width = `${Math.random() * 10 + 5}px`;
            particle.style.height = particle.style.width;
            particle.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`;
            particle.style.borderRadius = '50%';
            particle.style.position = 'absolute';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animation = `float ${Math.random() * 10 + 10}s infinite`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(particle);
        }
    }
    
    // Add parallax effect
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        bubbles.forEach((bubble, index) => {
            const factor = (index + 1) * 0.2;
            bubble.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
        });
    });
    
    // Bounce animation for CTA text
    const ctaText = document.querySelector('.cta-text');
    setInterval(() => {
        ctaText.classList.add('bounce');
        setTimeout(() => {
            ctaText.classList.remove('bounce');
        }, 1000);
    }, 5000);
    
    // Add bounce animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
        }
        
        .bounce {
            animation: bounce 1s;
        }
        
        .selected {
            border: 2px solid var(--primary);
            background-color: var(--gray-light);
        }
    `;
    document.head.appendChild(style);
});