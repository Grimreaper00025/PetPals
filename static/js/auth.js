document.addEventListener('DOMContentLoaded', function() {
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
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
            
            // Add pulse animation to the icon
            icon.style.animation = 'pulse 0.4s';
            setTimeout(() => {
                icon.style.animation = '';
            }, 400);
        });
    });
    
    // Form validation for signup
    const signupForm = document.querySelector('form[action*="signup"]');
    if (signupForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        
        signupForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Remove previous validation results
            removeValidation();
            
            // Validate name
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'Name is required');
                isValid = false;
            } else if (nameInput.value.trim().length < 3) {
                showError(nameInput, 'Name must be at least 3 characters');
                isValid = false;
            } else {
                showSuccess(nameInput);
            }
            
            // Validate email
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email');
                isValid = false;
            } else {
                showSuccess(emailInput);
            }
            
            // Validate password
            if (passwordInput.value === '') {
                showError(passwordInput, 'Password is required');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                showError(passwordInput, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                showSuccess(passwordInput);
            }
            
            // Validate confirm password
            if (confirmPasswordInput.value === '') {
                showError(confirmPasswordInput, 'Please confirm your password');
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                showError(confirmPasswordInput, 'Passwords do not match');
                isValid = false;
            } else {
                showSuccess(confirmPasswordInput);
            }
            
            if (!isValid) {
                e.preventDefault();
                
                // Scroll to the first error
                const firstError = document.querySelector('.form-group.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Add loading state to button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;
            }
        });
    }
    
    // Form validation for login
    const loginForm = document.querySelector('form[action*="login"]');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        loginForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Remove previous validation results
            removeValidation();
            
            // Validate email
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError(emailInput, 'Please enter a valid email');
                isValid = false;
            } else {
                showSuccess(emailInput);
            }
            
            // Validate password
            if (passwordInput.value === '') {
                showError(passwordInput, 'Password is required');
                isValid = false;
            } else {
                showSuccess(passwordInput);
            }
            
            if (!isValid) {
                e.preventDefault();
                
                // Scroll to the first error
                const firstError = document.querySelector('.form-group.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Add loading state to button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                submitBtn.disabled = true;
            }
        });
    }
    
    // Add floating particles effect
    createParticles();
    
    // Add animation to form inputs
    animateFormInputs();
    
    // Check for success flash messages and add confetti
    const successAlert = document.querySelector('.alert-success');
    if (successAlert) {
        createConfetti();
    }
    
    // Helper functions
    function removeValidation() {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }
    
    function showError(input, message) {
        const formGroup = input.parentElement;
        formGroup.classList.add('error');
        
        const errorMessage = document.createElement('span');
        errorMessage.className = 'error-message';
        errorMessage.innerText = message;
        formGroup.appendChild(errorMessage);
    }
    
    function showSuccess(input) {
        const formGroup = input.parentElement;
        formGroup.classList.add('success');
    }
    
    function isValidEmail(email) {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(email);
    }
    
    function createParticles() {
        const particleCount = 20;
        const container = document.querySelector('body');
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random size
            const size = Math.random() * 10 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            
            // Random opacity
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            // Random color
            const colors = ['rgba(108, 99, 255, 0.2)', 'rgba(255, 101, 132, 0.2)', 'rgba(255, 221, 100, 0.15)', 'rgba(102, 204, 153, 0.15)'];
            const colorIndex = Math.floor(Math.random() * colors.length);
            particle.style.backgroundColor = colors[colorIndex];
            
            // Animation
            const duration = Math.random() * 20 + 10;
            particle.style.animation = `float ${duration}s infinite`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(particle);
        }
    }
    
    function animateFormInputs() {
        const inputs = document.querySelectorAll('.auth-form input');
        
        inputs.forEach((input, index) => {
            input.style.transitionDelay = `${index * 0.05}s`;
            input.style.opacity = '0';
            input.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                input.style.opacity = '1';
                input.style.transform = 'translateY(0)';
            }, 100);
            
            // Add focus and blur effects
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                // Real-time validation on blur
                if (input.value.trim() !== '') {
                    if (input.type === 'email' && !isValidEmail(input.value)) {
                        showError(input, 'Please enter a valid email');
                    } else if (input.id === 'password' && input.value.length < 6) {
                        showError(input, 'Password must be at least 6 characters');
                    } else if (input.id === 'confirm_password') {
                        const passwordInput = document.getElementById('password');
                        if (input.value !== passwordInput.value) {
                            showError(input, 'Passwords do not match');
                        } else {
                            showSuccess(input);
                        }
                    } else {
                        showSuccess(input);
                    }
                }
            });
        });
    }
    
    function createConfetti() {
        const container = document.querySelector('body');
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            // Random position
            confetti.style.left = `${Math.random() * 100}%`;
            
            // Random size
            const size = Math.random() * 10 + 5;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            // Random colors
            const colors = ['#6c63ff', '#ff6584', '#ffd700', '#66cc99', '#4e46e5'];
            const colorIndex = Math.floor(Math.random() * colors.length);
            confetti.style.backgroundColor = colors[colorIndex];
            
            // Random delay
            confetti.style.animationDelay = `${Math.random() * 3}s`;
            
            container.appendChild(confetti);
            
            // Remove after animation completes
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
    
    // Social login buttons hover effect
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-5px) scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });
    });
});