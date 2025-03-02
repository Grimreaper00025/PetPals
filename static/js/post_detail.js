// post_detail.js

function likePost(postId) {
  fetch(postDetailLikeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "post_id=" + postId
  })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        document.getElementById("like-count-" + postId).textContent = data.likes;
      }
    });
}

function sharePost(postId, event) {
  event.preventDefault();
  navigator.clipboard.writeText(window.location.href.split('#')[0] + "#post-" + postId)
    .then(() => alert("Post link copied to clipboard!"))
    .catch(err => console.error("Error copying link: ", err));
}
