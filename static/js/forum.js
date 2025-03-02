document.addEventListener("DOMContentLoaded", function() {
  // Global variables for URLs
  const forumHomeUrl = window.location.pathname.includes('/forum') ? 
    window.location.pathname.split('?')[0] : '/community';
  const forumLikeUrl = '/like_post';

  // ======= Post interaction functions =======
  function likePost(postId) {
    fetch(forumLikeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "post_id=" + postId
    })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        const likeBtn = document.getElementById(`like-btn-${postId}`);
        const likeCount = document.getElementById(`like-count-${postId}`);
        
        likeCount.textContent = data.likes;
        
        if (data.liked) {
          likeBtn.classList.add('active');
          likeBtn.querySelector('i').classList.replace('far', 'fas');
        } else {
          likeBtn.classList.remove('active');
          likeBtn.querySelector('i').classList.replace('fas', 'far');
        }
        
        // Add animation
        likeCount.classList.add("pulse");
        setTimeout(() => {
          likeCount.classList.remove("pulse");
        }, 300);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
  
  function sharePost(postId, event) {
    event.stopPropagation();
    event.preventDefault();
    
    const postUrl = window.location.origin + 
      window.location.pathname.split('#')[0] + "#post-" + postId;
    
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        showToast("Link copied to clipboard!");
      })
      .catch(err => {
        console.error("Error copying link:", err);
        showToast("Couldn't copy link. Please try again.");
      });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) {
      // Create toast if it doesn't exist
      const newToast = document.createElement("div");
      newToast.id = "toast";
      newToast.className = "toast";
      newToast.textContent = message;
      document.body.appendChild(newToast);
      
      setTimeout(() => {
        newToast.classList.add("visible");
      }, 10);
      
      setTimeout(() => {
        newToast.classList.remove("visible");
        setTimeout(() => {
          document.body.removeChild(newToast);
        }, 300);
      }, 3000);
    } else {
      toast.textContent = message;
      toast.classList.add("visible");
      
      setTimeout(() => {
        toast.classList.remove("visible");
      }, 3000);
    }
  }

  // ======= Animal tags dropdown functionality =======
  // Updated toggle dropdown function
  function toggleDropdown() {
    const dropdown = document.getElementById('animalTagsDropdown');
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }

  // Updated select animal tag function
  function selectAnimalTag(animal) {
    const tagsInput = document.getElementById('animalTagsInput');
    const selectedTags = document.getElementById('selectedTags');
    
    // Parse existing tags
    let tags = tagsInput.value ? tagsInput.value.split(',') : [];
    
    // Only add if not already included
    if (!tags.includes(animal)) {
      tags.push(animal);
      
      // Create tag element
      const tagElement = document.createElement('span');
      tagElement.className = 'tag animal-tag';
      tagElement.innerHTML = `<i class="fas fa-paw"></i> ${animal} <i class="fas fa-times remove" onclick="removeTag('${animal}')"></i>`;
      selectedTags.appendChild(tagElement);
      
      // Update hidden input
      tagsInput.value = tags.join(',');
    }
  }

// Make sure dropdown is initially hidden in HTML
// Change in HTML: style="display: none;" for animalTagsDropdown
  const animalTagsHeader = document.getElementById("animalTagsHeader");
  const animalTagsDropdown = document.getElementById("animalTagsDropdown");
  
  if (animalTagsHeader && animalTagsDropdown) {
    animalTagsHeader.addEventListener("click", function() {
      animalTagsDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function(event) {
      if (!event.target.closest('.animal-tags-select')) {
        animalTagsDropdown.classList.remove("show");
      }
    });
    
    // Make dropdown items selectable
    const dropdownItems = document.querySelectorAll(".dropdown-item");
    const selectedTagsDiv = document.getElementById("selectedTags");
    const animalTagsInput = document.getElementById("animalTagsInput");
    
    dropdownItems.forEach(function(item) {
      item.addEventListener("click", function() {
        const value = this.getAttribute("data-value");
        const text = this.textContent.trim();
        
        // Check if tag already selected
        const existingTags = Array.from(selectedTagsDiv.querySelectorAll(".selected-tag"))
          .map(tag => tag.getAttribute("data-value"));
        
        if (!existingTags.includes(value)) {
          const newTag = document.createElement("div");
          newTag.classList.add("selected-tag", "tag");
          newTag.setAttribute("data-value", value);
          newTag.innerHTML = `${text} <span class="remove">&times;</span>`;
          
          newTag.querySelector(".remove").addEventListener("click", function(e) {
            e.stopPropagation();
            newTag.remove();
            updateAnimalTagsInput();
          });
          
          selectedTagsDiv.appendChild(newTag);
          updateAnimalTagsInput();
        }
      });
    });
    
    function updateAnimalTagsInput() {
      const selectedTags = selectedTagsDiv.querySelectorAll(".selected-tag");
      const values = Array.from(selectedTags).map(tag => tag.getAttribute("data-value"));
      animalTagsInput.value = values.join(",");
    }
  }

  // ======= Filter and search functionality =======
  const searchQuery = document.getElementById("searchQuery");
  const locationFilter = document.getElementById("locationFilter");
  const animalFilter = document.getElementById("animalFilter");
  const sortOption = document.getElementById("sortOption");
  const categoryFilter = document.getElementById("categoryFilter");
  
  // Apply search on Enter key
  if (searchQuery) {
    searchQuery.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        applyFilters();
      }
    });
  }
  
  // Apply filters on change
  [locationFilter, animalFilter, sortOption, categoryFilter].forEach(el => {
    if (el) {
      el.addEventListener("change", applyFilters);
    }
  });
  
  function applyFilters() {
    const query = searchQuery ? searchQuery.value : '';
    const location = locationFilter ? locationFilter.value : 'worldwide';
    const animal = animalFilter ? animalFilter.value : '';
    const sort = sortOption ? sortOption.value : 'newest';
    const category = categoryFilter ? categoryFilter.value : '';
    
    let url = forumHomeUrl;
    const params = [];
    
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (location !== 'worldwide') params.push(`location=${encodeURIComponent(location)}`);
    if (animal) params.push(`animal_filter=${encodeURIComponent(animal)}`);
    if (sort !== 'newest') params.push(`sort=${encodeURIComponent(sort)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    window.location.href = url;
  }

  // Filter by popular tag using "animal_filter"
  function filterByTag(tag) {
    const location = document.getElementById('locationFilter')?.value || 'worldwide';
    const sort = document.getElementById('sortOption')?.value || 'newest';
    
    let url = forumHomeUrl + '?';
    
    url += `animal_filter=${encodeURIComponent(tag)}`;
    
    if (location !== 'worldwide') {
      url += `&location=${encodeURIComponent(location)}`;
    }
    
    if (sort !== 'newest') {
      url += `&sort=${encodeURIComponent(sort)}`;
    }
    
    window.location.href = url;
  }
  // ======= Post expandable content =======
  const postHeaders = document.querySelectorAll(".post-header");
  postHeaders.forEach(header => {
    header.addEventListener("click", function() {
      const post = this.closest(".post");
      const content = post.querySelector(".post-content");
      
      if (content) {
        if (content.style.display === "none" || !content.style.display) {
          content.style.display = "block";
          setTimeout(() => {
            content.style.opacity = "1";
          }, 10);
        } else {
          content.style.opacity = "0";
          setTimeout(() => {
            content.style.display = "none";
          }, 300);
        }
      }
    });
  });

  // ======= Reply form toggle =======
  const replyButtons = document.querySelectorAll(".reply-btn");
  replyButtons.forEach(button => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const postId = this.getAttribute("data-post-id");
      const replyForm = document.getElementById("reply-form-" + postId);
      
      if (replyForm) {
        replyForm.classList.toggle("visible");
        if (replyForm.classList.contains("visible")) {
          replyForm.querySelector("textarea").focus();
        }
      }
    });
  });

  // ======= Background animation =======
  function createStars() {
    const starsContainer = document.querySelector(".stars-container");
    if (!starsContainer) return;
    
    for (let i = 0; i < 50; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      
      const size = Math.random() * 3 + 1;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const duration = Math.random() * 5 + 2;
      const delay = Math.random() * 5;
      
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = posX + "%";
      star.style.top = posY + "%";
      star.style.animationDuration = duration + "s";
      star.style.animationDelay = delay + "s";
      
      starsContainer.appendChild(star);
    }
  }
  
  // Initialize animations
  createStars();

  // ======= Add event listeners to existing elements =======
  const likeButtons = document.querySelectorAll("[id^='like-btn-']");
  likeButtons.forEach(button => {
    const postId = button.id.replace("like-btn-", "");
    button.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      likePost(postId);
    });
  });

  const shareButtons = document.querySelectorAll("[id^='share-btn-']");
  shareButtons.forEach(button => {
    const postId = button.id.replace("share-btn-", "");
    button.addEventListener("click", function(e) {
      sharePost(postId, e);
    });
  });

  // Make global functions available
  window.likePost = likePost;
  window.sharePost = sharePost;
});
