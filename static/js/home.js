document.addEventListener('DOMContentLoaded', function() {
    // Generate stars for background
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
    
    // Generate floating particles
    const backgroundAnimation = document.querySelector('.background-animation');
    const particleCount = 15;
    const colors = ['rgba(108, 99, 255, 0.2)', 'rgba(255, 101, 132, 0.2)', 'rgba(255, 193, 7, 0.2)'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = `${Math.random() * 10 + 5}px`;
        particle.style.height = particle.style.width;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        backgroundAnimation.appendChild(particle);
    }
    
    // Handle pet card clicks
    const petCards = document.querySelectorAll('.pet-card');
    const modal = document.getElementById('petModal');
    const selectedPetElement = document.getElementById('selectedPet');
    const modalPetIcon = document.getElementById('modalPetIcon');
    const closeButton = document.querySelector('.close-button');
    const cancelButton = document.getElementById('cancelButton');
    const continueButton = document.getElementById('continueButton');
    
    petCards.forEach(card => {
        card.addEventListener('click', function() {
            const petType = this.getAttribute('data-pet');
            const petName = this.querySelector('.pet-name').textContent;
            const petIconClass = this.querySelector('.pet-image i').className;
            
            // Set modal content
            selectedPetElement.textContent = petName;
            modalPetIcon.className = petIconClass;
            
            // Store selected pet in session storage for pet_info page
            sessionStorage.setItem('selectedPet', petType);
            sessionStorage.setItem('selectedPetName', petName);
            
            // Show modal with animation
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
        });
    });
    
    // Close modal functions
    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Continue button action (redirect to pet_info page instead of signup)
    continueButton.addEventListener('click', function() {
        window.location.href = "{{ url_for('pet_info') }}";
    });
    
    // Interactivity for pet cards: Add smooth hover animation to each pet's image icon
    petCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.pet-image i');
            icon.style.transform = 'scale(1.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.pet-image i');
            icon.style.transform = 'scale(1)';
        });
    });
    
    // Add scroll animation for sections
    const sections = document.querySelectorAll('section');
    
    function checkScroll() {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (sectionTop < windowHeight * 0.75) {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Initial check when page loads
    setTimeout(checkScroll, 500);
    
    // Check on scroll
    window.addEventListener('scroll', checkScroll);
    
    // Add animation to highlight spans
    const highlights = document.querySelectorAll('.highlight');
    
    highlights.forEach(highlight => {
        highlight.addEventListener('mouseenter', function() {
            this.style.color = 'var(--primary-dark)';
        });
        
        highlight.addEventListener('mouseleave', function() {
            this.style.color = 'var(--primary)';
        });
    });
    
    // Feature cards hover effect enhancement
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Scale up the feature icon and add a glow effect
            const featureIcon = this.querySelector('.feature-icon');
            featureIcon.style.transform = 'scale(1.1)';
            featureIcon.style.boxShadow = '0 0 15px rgba(108, 99, 255, 0.5)';
            
            // Add a subtle background transition
            this.style.backgroundColor = 'var(--gray-light)';
            
            // Enhance the heading color
            const heading = this.querySelector('h3');
            heading.style.color = 'var(--primary)';
        });
        
        card.addEventListener('mouseleave', function() {
            // Reset the feature icon
            const featureIcon = this.querySelector('.feature-icon');
            featureIcon.style.transform = '';
            featureIcon.style.boxShadow = '';
            
            // Reset the background
            this.style.backgroundColor = 'var(--white)';
            
            // Reset the heading color
            const heading = this.querySelector('h3');
            heading.style.color = '';
        });
    });
});