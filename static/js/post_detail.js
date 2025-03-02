function likePost(postId) {
  const likeButton = document.querySelector(`[onclick="likePost('${postId}')"]`);
  const heartIcon = likeButton.querySelector('i');
  
  // Add heart animation
  heartIcon.classList.add('heart-animation');
  
  // Remove animation class after animation completes
  setTimeout(() => {
    heartIcon.classList.remove('heart-animation');
  }, 800);
  
  fetch(postDetailLikeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ post_id: postId })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.error) {
      const likeCountElement = document.getElementById("like-count-" + postId);
      
      // Animate the count change
      likeCountElement.style.transform = "scale(1.3)";
      likeCountElement.style.color = "#ff6584";
      
      setTimeout(() => {
        likeCountElement.textContent = data.likes;
        likeCountElement.style.transform = "scale(1)";
        
        // Update the button state based on server response
        if (data.liked) {
          heartIcon.classList.remove('far');
          heartIcon.classList.add('fas');
          likeButton.classList.add('active');
        } else {
          heartIcon.classList.remove('fas');
          heartIcon.classList.add('far');
          likeButton.classList.remove('active');
        }
        
        setTimeout(() => {
          likeCountElement.style.color = "";
        }, 300);
      }, 300);
    }
  })
  .catch(err => console.error("Error liking post:", err));
}

function sharePost(postId, event) {
  event.preventDefault();
  navigator.clipboard.writeText(window.location.href.split('#')[0] + "#post-" + postId)
    .then(() => {
      // Create and show toast notification instead of alert
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Link copied to clipboard!</span>
      `;
      document.body.appendChild(toast);
      
      // Trigger animation
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    })
    .catch(err => console.error("Error copying link: ", err));
}

// Add smooth scrolling for reply links
document.addEventListener('DOMContentLoaded', function() {
  // Check if URL has hash and scroll smoothly
  if (window.location.hash) {
    const targetElement = document.querySelector(window.location.hash);
    if (targetElement) {
      setTimeout(() => {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
        
        // Highlight the targeted reply
        targetElement.style.boxShadow = '0 0 0 3px var(--primary-light)';
        setTimeout(() => {
          targetElement.style.boxShadow = '';
        }, 2000);
      }, 500);
    }
  }
  
  // Add animations when replies come into view
  const replies = document.querySelectorAll('.reply');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateX(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    replies.forEach(reply => {
      reply.style.opacity = "0";
      reply.style.transform = "translateX(-10px)";
      reply.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(reply);
    });
  }
});