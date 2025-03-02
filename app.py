from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson import ObjectId
import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import requests
from datetime import datetime
from dotenv import load_dotenv
from google import genai


import uuid
from datetime import datetime, timedelta

load_dotenv()

# Access the API key
api_key = os.getenv("GEMINI_API_KEY")
SERP_API_KEY = os.getenv("SERP_API_KEY")

app = Flask(__name__)
app.secret_key = os.urandom(24)

# MongoDB connection
from flask_jwt_extended import (
    JWTManager, create_access_token, set_access_cookies,
    unset_jwt_cookies, get_jwt_identity, jwt_required, verify_jwt_in_request
)

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Enable CSRF in production!
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") or "super-secret-key"
jwt = JWTManager(app)
# ------------------

# Helper function – retrieves the current user from JWT
def get_current_user():
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return {"username": "Guest", "location": "Unknown", "email": "", "avatar_color": "#4e73df"}
    identity = get_jwt_identity()
    if identity:
        user = users.find_one({"_id": ObjectId(identity)})
        if user:
            user['username'] = user.get('name', 'Guest')
            return user
    return {"username": "Guest", "location": "Unknown", "email": "", "avatar_color": "#4e73df"}

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['petpals_dashboard']
users = db['users']
pets = db['pets']

# Initialize Bcrypt for password hashing
bcrypt = Bcrypt(app)

# Configure Gemini AI
Gemini_client = genai.Client(api_key=api_key)


# Define pet breeds and forum globals:
PET_BREEDS = {
    "dog": ["Labrador", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle", "Beagle", "Chihuahua", "Husky", "Dachshund", "Mixed Breed"],
    "cat": ["Persian", "Maine Coon", "Siamese", "Bengal", "Ragdoll", "Scottish Fold", "Sphynx", "Abyssinian", "British Shorthair", "Mixed Breed"],
    "bird": ["Parakeet", "Cockatiel", "Canary", "Lovebird", "Parrot", "Finch", "Macaw", "Conure", "Cockatoo", "Other"],
    "fish": ["Goldfish", "Betta", "Guppy", "Angelfish", "Tetra", "Cichlid", "Molly", "Discus", "Koi", "Other"],
    "rabbit": ["Holland Lop", "Mini Rex", "Dutch", "Netherland Dwarf", "Lionhead", "English Angora", "Flemish Giant", "Rex", "Mini Lop", "Mixed Breed"],
    "hamster": ["Syrian", "Dwarf Campbell", "Winter White", "Roborovski", "Chinese", "Other"]
}
available_animal_tags = list(PET_BREEDS.keys())
available_locations = ["New York", "Los Angeles", "Chicago", "Boston", "Miami", "Seattle", "Austin", "Denver"]

# Routes
@app.route('/')
def home():
    user = get_current_user()
    # If a valid user is logged in (i.e. not the default guest), redirect to dashboard.
    if user and user.get("username") != "Guest":
        return redirect(url_for("dashboard"))
    return render_template('home.html')

@app.context_processor
def inject_user():
    """Make user available to all templates."""
    if 'user_id' in session:
        user = users.find_one({"_id": ObjectId(session['user_id'])})
        return {'user': user}
    return {'user': None}

@app.route('/get_breeds/<pet_type>')
def get_breeds(pet_type):
    if pet_type in PET_BREEDS:
        return jsonify(PET_BREEDS[pet_type])
    return jsonify([])

@app.route('/dashboard')
def dashboard():
    current_user = get_current_user()
    if current_user.get("username") == "Guest":
        return redirect(url_for('login'))
    user_id = get_jwt_identity()
    user_pets = list(pets.find({"user_id": ObjectId(user_id)}))
    if 'events' in current_user:
        current_user['events'].sort(key=lambda x: x['date'])
    return render_template('dashboard.html', user=current_user, pets=user_pets)

# Signup – if already logged in, redirect to dashboard; else create JWT token.
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if get_current_user().get("username") != "Guest":
        return redirect(url_for("dashboard"))
    if request.method == 'POST':
        existing_user = users.find_one({'email': request.form.get('email')})
        if existing_user is None:
            hashed_password = bcrypt.generate_password_hash(request.form.get('password')).decode('utf-8')
            user_id = users.insert_one({
                'name': request.form.get('name'),
                'email': request.form.get('email'),
                'password': hashed_password,
                'avatar_url': "https://i.pravatar.cc/150?img=32",
                'member_since': datetime.now().strftime("%B %d, %Y"),
                'bio': "Pet enthusiast and proud pet owner.",
                'events': [],
                'created_at': datetime.now()
            }).inserted_id
            if 'pet_data' in session:
                pet_data = session.pop('pet_data')
                pet_data['user_id'] = user_id
                pet_data['owner'] = request.form.get('name')
                pets.insert_one(pet_data)
            session.clear()
            access_token = create_access_token(identity=str(user_id))
            response = redirect(url_for('dashboard'))
            set_access_cookies(response, access_token)
            flash('Account created successfully!', 'success')
            return response
        flash('Email already exists!', 'danger')
    return render_template('signup.html')

# Login – if already logged in, redirect to dashboard; else create JWT token.
@app.route('/login', methods=['GET', 'POST'])
def login():
    if get_current_user().get("username") != "Guest":
        return redirect(url_for("dashboard"))
    if request.method == 'POST':
        user = users.find_one({'email': request.form.get('email')})
        if user and bcrypt.check_password_hash(user['password'], request.form.get('password')):
            access_token = create_access_token(identity=str(user['_id']))
            response = redirect(url_for('dashboard'))
            set_access_cookies(response, access_token)
            if 'pet_data' in session:
                pet_data = session.pop('pet_data')
                pet_data['user_id'] = user['_id']
                pet_data['owner'] = user['name']
                pets.insert_one(pet_data)
            flash('Logged in successfully!', 'success')
            return response
        flash('Invalid email or password!', 'danger')
    return render_template('login.html')

# Logout – clear the JWT cookies.
@app.route('/logout')
def logout():
    response = redirect(url_for('home'))
    unset_jwt_cookies(response)
    return (response)

@app.route('/pet_info', methods=['GET', 'POST'])
def pet_info():
    if request.method == 'POST':
        pet_data = {
            'type': request.form.get('pet_type'),
            'name': request.form.get('pet_name'),
            'breed': request.form.get('pet_breed'),
            'age': int(request.form.get('pet_age')),
            'weight': request.form.get('pet_weight'),
            'vaccinated': request.form.get('vaccinated') == 'on',
            'feeding_schedule': "Morning and evening",
            'vaccination_date': datetime.now().strftime("%Y-%m-%d"),
            'grooming_schedule': "Weekly",
            'walking_schedule': "Morning and evening" if request.form.get('pet_type') == "dog" else "N/A",
            'treat_time': "After walks or training",
            'created_at': datetime.now()
        }
        
        # Set default image based on pet type
        pet_type = pet_data['type'].lower()
        if pet_type == 'dog':
            pet_data['image_url'] = "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        elif pet_type == 'cat':
            pet_data['image_url'] = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        elif pet_type == 'bird':
            pet_data['image_url'] = "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmlyZHxlbnwwfHwwfHx8MA%3D%3D"
        elif pet_type == 'fish':
            pet_data['image_url'] = "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmlzaHxlbnwwfHwwfHx8MA%3D%3D"
        else:
            pet_data['image_url'] = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        
        # If user is logged in, add pet directly
        if 'user_id' in session:
            user = users.find_one({"_id": ObjectId(session['user_id'])})
            pet_data['user_id'] = ObjectId(session['user_id'])
            pet_data['owner'] = user['name']
            pets.insert_one(pet_data)
            return redirect(url_for('dashboard'))
        else:
            # Store pet data in session for later use after user signup/login
            session['pet_data'] = pet_data
            return redirect(url_for('signup'))
        
    return render_template('pet_info.html', pet_breeds=PET_BREEDS)

@app.route('/edit_profile', methods=['GET', 'POST'])
def edit_profile():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        # Get form data
        updated_user = {
            'name': request.form.get('name'),
            'email': request.form.get('email'),
            'bio': request.form.get('bio')
        }
        
        # Keep existing fields
        for key in user:
            if key not in updated_user and key != '_id':
                updated_user[key] = user[key]
        
        # Handle profile image upload
        if 'profile_image' in request.files and request.files['profile_image'].filename:
            profile_image = request.files['profile_image']
            
            # Generate a secure filename
            filename = secure_filename(profile_image.filename)
            
            # Create a unique filename with timestamp
            file_ext = os.path.splitext(filename)[1]
            unique_filename = f"profile_{uuid.uuid4().hex}{file_ext}"
            
            # Ensure upload directory exists
            upload_dir = os.path.join(app.static_folder, 'uploads', 'profiles')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            profile_image.save(file_path)
            
            # Set the avatar URL in the database
            updated_user['avatar_url'] = f"/static/uploads/profiles/{unique_filename}"
            
            # Delete the old image file if it exists and isn't a default image
            if 'avatar_url' in user and not user['avatar_url'].startswith('https://'):
                try:
                    old_image_path = os.path.join(app.root_path, 'static', user['avatar_url'].replace('/static/', ''))
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                except Exception as e:
                    print(f"Error removing old profile image: {e}")
        
        # Update user
        users.update_one({"_id": user["_id"]}, {"$set": updated_user})
        
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('edit_profile.html', user=user)

@app.route('/add_event', methods=['POST'])
def add_event():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    # Get form data
    new_event = {
        'title': request.form.get('title'),
        'date': request.form.get('date'),
        'description': request.form.get('description'),
        'icon': request.form.get('icon')
    }
    
    # Add pet reference if provided
    pet_id = request.form.get('pet_id')
    if pet_id:
        new_event['pet_id'] = pet_id
        # Get pet name for the event title if not already specified
        pet = pets.find_one({'_id': ObjectId(pet_id)})
        if pet:
            new_event['pet_name'] = pet['name']
    
    # Add event to user's events array
    users.update_one(
        {"_id": user["_id"]},
        {"$push": {"events": new_event}}
    )
    
    flash('Event added successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/get_event/<event_index>')
def get_event(event_index):
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not logged in'})
    
    try:
        event_index = int(event_index)
        if 'events' in user and event_index < len(user['events']):
            return jsonify({
                'success': True,
                'event': user['events'][event_index]
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Event not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/update_event', methods=['POST'])
def update_event():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    event_index = int(request.form.get('event_index'))
    
    # Get form data
    updated_event = {
        'title': request.form.get('title'),
        'date': request.form.get('date'),
        'description': request.form.get('description'),
        'icon': request.form.get('icon')
    }
    
    # Add pet reference if provided
    pet_id = request.form.get('pet_id')
    if pet_id:
        updated_event['pet_id'] = pet_id
        # Get pet name for the event title if not already specified
        pet = pets.find_one({'_id': ObjectId(pet_id)})
        if pet:
            updated_event['pet_name'] = pet['name']
    
    # Update the event in the user's events array
    if 'events' in user and event_index < len(user['events']):
        user['events'][event_index] = updated_event
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"events": user['events']}}
        )
    
    flash('Event updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/delete_event/<event_index>', methods=['POST'])
def delete_event(event_index):
    user = get_current_user()
    if not user:
        return 'User not logged in', 401
    
    try:
        event_index = int(event_index)
        
        if 'events' in user and event_index < len(user['events']):
            # Remove the event at the specified index
            user['events'].pop(event_index)
            
            # Update the user document
            users.update_one(
                {"_id": user["_id"]},
                {"$set": {"events": user['events']}}
            )
            
            return '', 204  # No content, success
        else:
            return 'Event not found', 404
    except Exception as e:
        return str(e), 500

@app.route('/pet/<pet_id>')
def pet_details(pet_id):
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    pet = pets.find_one({'_id': ObjectId(pet_id)})
    if not pet or str(pet.get('user_id')) != session['user_id']:
        flash('Pet not found or you do not have permission to view this pet', 'danger')
        return redirect(url_for('dashboard'))
    
    # Basic pet info for prompts
    pet_info = f"Pet: {pet['name']}, Type: {pet['type']}, Breed: {pet['breed']}, Age: {pet['age']}"
    
    # Get fun facts specific to the pet
    fun_facts_prompt = f"""Give 3-5 interesting and fun facts about {pet['breed']} {pet['type']}s. Format as a bulleted list.IMPORTANT: Do not use any Markdown formatting in your response. Do not use asterisks (*) for emphasis or formatting. 
Instead, use plain text with paragraph breaks for organization. Use ALL CAPS for headings or important points. Use numbering and leave line after each fact"""
    try:
        fun_facts_response = Gemini_client.models.generate_content(
            model="gemini-2.0-flash", contents=fun_facts_prompt)
        fun_facts = fun_facts_response.text
    except Exception as e:
        print(f"Error getting fun facts: {e}")
        fun_facts = "Could not generate fun facts at this time."
    
    # Get care recommendations for the pet
    care_prompt = f"""Give specific care recommendations for a {pet['breed']} {pet['type']} that is {pet['age']} years old. Include advice on diet, exercise, grooming, and health concerns. Format as a bulleted list with category headers. Each point should be short and concise. Give 3 to 5 points 
    IMPORTANT: Do not use any Markdown formatting in your response. Do not use asterisks (*) for emphasis or formatting. 
Instead, use plain text with paragraph breaks for organization. Use ALL CAPS for headings or important points. Use numbering and leave line after each headfing"""
    try:
        care_response = Gemini_client.models.generate_content(
            model="gemini-2.0-flash", contents=care_prompt)
        care_recommendations = care_response.text
    except Exception as e:
        print(f"Error getting care recommendations: {e}")
        care_recommendations = "Could not generate care recommendations at this time."
    
    return render_template('pet_details.html', 
                          pet=pet, 
                          fun_facts=fun_facts, 
                          care_recommendations=care_recommendations)

@app.route('/add_pet', methods=['GET', 'POST'])
def add_pet():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        # Initialize pet data from form
        new_pet = {
            'name': request.form.get('name'),
            'type': request.form.get('type'),
            'breed': request.form.get('breed'),
            'age': int(request.form.get('age')),
            'user_id': ObjectId(session['user_id']),
            'owner': user['name'],
            'feeding_schedule': request.form.get('feeding_schedule'),
            'vaccination_date': request.form.get('vaccination_date'),
            'grooming_schedule': request.form.get('grooming_schedule'),
            'walking_schedule': request.form.get('walking_schedule'),
            'treat_time': request.form.get('treat_time'),
            'created_at': datetime.now()
        }
        
        # Handle pet image upload
        if 'pet_image' in request.files and request.files['pet_image'].filename:
            pet_image = request.files['pet_image']
            
            # Generate a secure filename
            filename = secure_filename(pet_image.filename)
            
            # Create a unique filename with timestamp
            file_ext = os.path.splitext(filename)[1]
            unique_filename = f"pet_{uuid.uuid4().hex}{file_ext}"
            
            # Ensure upload directory exists
            upload_dir = os.path.join(app.static_folder, 'uploads', 'pets')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            pet_image.save(file_path)
            
            # Set the image URL in the database
            new_pet['image_url'] = f"/static/uploads/pets/{unique_filename}"
        else:
            # Set default image based on pet type
            pet_type = new_pet['type'].lower()
            if pet_type == 'dog':
                new_pet['image_url'] = "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
            elif pet_type == 'cat':
                new_pet['image_url'] = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
            elif pet_type == 'bird':
                new_pet['image_url'] = "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmlyZHxlbnwwfHwwfHx8MA%3D%3D"
            elif pet_type == 'fish':
                new_pet['image_url'] = "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmlzaHxlbnwwfHwwfHx8MA%3D%3D"
            elif pet_type == 'reptile':
                new_pet['image_url'] = "https://images.unsplash.com/photo-1610629651605-0b181ad69aab?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            else:
                new_pet['image_url'] = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        
        # Insert the new pet
        pets.insert_one(new_pet)
        
        flash('Pet added successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('add_pet.html', pet_breeds=PET_BREEDS)

@app.route('/edit_pet/<pet_id>', methods=['GET', 'POST'])
def edit_pet(pet_id):
    user = get_current_user()
    if not user:
     return redirect(url_for('login'))


    pet = pets.find_one({'_id': ObjectId(pet_id)})
    if not pet or str(pet.get('user_id')) != session['user_id']:
        flash('Pet not found or you do not have permission to edit this pet', 'danger')
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        # Initialize updated pet data from form
        updated_pet = {
            'name': request.form.get('name'),
            'type': request.form.get('type'),
            'breed': request.form.get('breed'),
            'age': int(request.form.get('age')),
            'feeding_schedule': request.form.get('feeding_schedule'),
            'vaccination_date': request.form.get('vaccination_date'),
            'grooming_schedule': request.form.get('grooming_schedule'),
            'walking_schedule': request.form.get('walking_schedule'),
            'treat_time': request.form.get('treat_time')
        }
        
        # Handle pet image upload
        if 'pet_image' in request.files and request.files['pet_image'].filename:
            pet_image = request.files['pet_image']
            
            # Generate a secure filename
            filename = secure_filename(pet_image.filename)
            
            # Create a unique filename with timestamp
            file_ext = os.path.splitext(filename)
            unique_filename = f"pet_{uuid.uuid4().hex}{file_ext}"
            
            # Ensure upload directory exists
            upload_dir = os.path.join(app.static_folder, 'uploads', 'pets')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            pet_image.save(file_path)
            
            # Set the image URL in the database
            updated_pet['image_url'] = f"/static/uploads/pets/{unique_filename}"
            
            # Delete the old image file if it exists and isn't a default image
            if 'image_url' in pet and not pet['image_url'].startswith('https://'):
                try:
                    old_image_path = os.path.join(app.root_path, 'static', pet['image_url'].replace('/static/', ''))
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                except Exception as e:
                    print(f"Error removing old pet image: {e}")
        
        # Update the pet
        pets.update_one({"_id": ObjectId(pet_id)}, {"$set": updated_pet})
        
        flash('Pet updated successfully!', 'success')
        return redirect(url_for('pet_details', pet_id=pet_id))

    return render_template('edit_pet.html', pet=pet, pet_breeds=PET_BREEDS) 

@app.route('/delete_pet', methods=['POST'])
def delete_pet():
    pet_id = request.form.get('pet_id')
    
    # Get the pet to delete (to access the image path)
    pet = pets.find_one({'_id': ObjectId(pet_id)})
    
    if pet:
        # Delete the pet's image if it's not a default image
        if pet['image_url'] and not pet['image_url'].startswith('/static/images/default_'):
            try:
                image_path = os.path.join(app.root_path, 'static', pet['image_url'].replace('/static/', ''))
                if os.path.exists(image_path):
                    os.remove(image_path)
            except Exception as e:
                # Log the error but continue with the deletion
                print(f"Error removing pet image: {e}")
        
        # Delete the pet from the database
        pets.delete_one({'_id': ObjectId(pet_id)})
    
    return redirect(url_for('dashboard'))



@app.route("/services")
def services():
    # Expanded list of pet services
    services_list = [
        {"name": "Veterinary Care", "icon": "fa-user-md", "description": "Regular vets, emergency hospitals, and specialty veterinarians"},
        {"name": "Pet Grooming", "icon": "fa-cut", "description": "Full-service groomers, mobile grooming, and self-service wash"},
        {"name": "Pet Training", "icon": "fa-graduation-cap", "description": "Obedience trainers, behavior specialists, and group classes"},
        {"name": "Pet Boarding", "icon": "fa-home", "description": "Kennels, pet hotels, in-home sitters, and doggy daycare"},
        {"name": "Dog Parks", "icon": "fa-tree", "description": "Dog parks, pet-friendly restaurants, cafes, and hotels"},
        {"name": "Pet Adoption", "icon": "fa-heart", "description": "Shelters, breed-specific rescues, and foster organizations"},
        {"name": "Pet Transportation", "icon": "fa-car", "description": "Pet taxis, pet-friendly rideshare, and transport services"},
        {"name": "Pet Specialty Services", "icon": "fa-camera", "description": "Pet photography, massage therapy, and hydrotherapy"}
    ]
    return render_template("services.html", services=services_list)

@app.route("/results", methods=["POST"])
def results():
    service_type = request.form.get("service_type")
    lat = request.form.get("lat")
    lng = request.form.get("lng")
    # Build location string in the format: @latitude,longitude,15.1z
    location_str = f"@{lat},{lng},15.1z"
    
    # Prepare the SERP API request using the google_maps engine
    params = {
        "engine": "google_maps",
        "q": service_type,
        "ll": location_str,
        "type": "search",
        "api_key": SERP_API_KEY
    }
    serp_url = "https://serpapi.com/search"
    response = requests.get(serp_url, params=params)
    data = response.json()
    local_results = data.get("local_results", [])
    
    return render_template("results.html", results=local_results, lat=lat, lng=lng, service_type=service_type)


@app.route('/community')
def community():
    sort_option = request.args.get('sort', 'newest')
    category_filter = request.args.get('category', None)
    location_filter = request.args.get('location', 'worldwide')
    animal_filter = request.args.get('animal_filter', None)
    
    query = {"parent": None}
    if location_filter != 'worldwide':
        query["location"] = location_filter
    if category_filter:
        query["category"] = {"$regex": f"^{category_filter}$", "$options": "i"}
    if animal_filter:
        # Use case-insensitive regex for animal tags
        query["animal_tags"] = {"$regex": f"^{animal_filter}$", "$options": "i"}
    
    posts = list(db.posts.find(query))
    
    # Compute reply count for each post
    for p in posts:
        p['reply_count'] = db.posts.count_documents({"parent": p['_id']})
    
    if sort_option == 'newest':
        posts.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
    elif sort_option == 'oldest':
        posts.sort(key=lambda x: x.get('timestamp', datetime.max))
    elif sort_option == 'most_liked':
        posts.sort(key=lambda x: x.get('likes', 0), reverse=True)
    elif sort_option == 'most_active':
        posts.sort(key=lambda x: x.get('reply_count', 0), reverse=True)
    
    categories = db.posts.distinct("category")
    current_user = get_current_user()
    
    return render_template(
        'community.html',
        posts=posts,
        current_user=current_user,
        sort_option=sort_option,
        category_filter=category_filter,
        location_filter=location_filter,
        animal_filter=animal_filter,
        categories=categories,
        available_locations=available_locations,
        available_animal_tags=available_animal_tags
    )


@app.route('/create_post', methods=['POST'])
def create_post():
    title = request.form.get('title')
    content = request.form.get('content')
    category = request.form.get('category', 'general')
    animal_tags = request.form.get('animal_tags')
    if animal_tags:
        animal_tags = [tag.strip() for tag in animal_tags.split(',')]
    else:
        pet_type = request.form.get('pet_type', 'general')
        pet_breed = request.form.get('pet_breed', None)
        if pet_breed:
            animal_tags = [pet_type, pet_breed]
        else:
            animal_tags = [pet_type]
    
    current_user = get_current_user()
    
    if title and content:
        post = {
            "_id": str(uuid.uuid4()),
            "title": title,
            "content": content,
            "user": current_user['username'],
            "location": current_user.get('location', 'Unknown'),
            "email": current_user.get('email', ''),
            "timestamp": datetime.utcnow(),
            "likes": 0,
            "category": category,
            "animal_tags": animal_tags,
            "parent": None,
            "liked_by": [],
            "avatar_color": current_user.get('avatar_color', '#4e73df')
        }
        db.posts.insert_one(post)
        flash('Your post has been created successfully!', 'success')
    else:
        flash('Both title and content are required.', 'error')
    location_filter = request.args.get('location', 'worldwide')
    return redirect(url_for('community', location=location_filter))


@app.route('/create_reply', methods=['POST'])
def create_reply():
    content = request.form.get('content')
    parent_id = request.form.get('parent_id')
    if not content:
        flash('Reply content cannot be empty.', 'error')
        return redirect(request.referrer or url_for('community'))
    if not parent_id:
        flash('Parent post not specified.', 'error')
        return redirect(request.referrer or url_for('community'))
    parent_post = db.posts.find_one({"_id": parent_id})
    if not parent_post:
        flash('Parent post not found.', 'error')
        return redirect(request.referrer or url_for('community'))
    
    current_user = get_current_user()
    
    reply = {
        "_id": str(uuid.uuid4()),
        "content": content,
        "user": current_user['username'],
        "location": current_user.get('location', 'Unknown'),
        "email": current_user.get('email', ''),
        "timestamp": datetime.utcnow(),
        "likes": 0,
        "category": parent_post.get('category', 'general'),
        "parent": parent_id,
        "liked_by": [],
        "avatar_color": current_user.get('avatar_color', '#4e73df')
    }
    db.posts.insert_one(reply)
    flash('Your reply has been posted.', 'success')
    return redirect(request.referrer or url_for('community') + f"#post-{reply['_id']}")


@app.route('/like_post', methods=['POST'])
def like_post():
    post_id = request.form.get('post_id') or request.json.get('post_id')
    if not post_id:
        return jsonify({"error": "Post ID not provided"}), 400
    
    post = db.posts.find_one({"_id": post_id})
    if not post:
        return jsonify({"error": "Post not found"}), 404
    
    current_user = get_current_user()
    user_id = current_user['username']
    
    # Check if user already liked the post
    if user_id in post.get('liked_by', []):
        # Unlike the post
        db.posts.update_one({"_id": post_id}, {"$pull": {"liked_by": user_id}})
        db.posts.update_one({"_id": post_id}, {"$set": {"likes": len(post.get('liked_by', [])) - 1}})
        liked = False
    else:
        # Like the post
        db.posts.update_one({"_id": post_id}, {"$push": {"liked_by": user_id}})
        db.posts.update_one({"_id": post_id}, {"$set": {"likes": len(post.get('liked_by', [])) + 1}})
        liked = True
    
    updated_post = db.posts.find_one({"_id": post_id})
    return jsonify({"likes": updated_post.get("likes", 0), "liked": user_id in updated_post.get('liked_by', [])})


@app.route('/search', methods=['GET'])
def search_posts():
    query_text = request.args.get('q', '')
    location_filter = request.args.get('location', 'worldwide')
    animal_filter = request.args.get('animal_filter', None)
    
    if not query_text:
        return redirect(url_for('community', location=location_filter))
    
    # Only search in main posts, not replies
    search_conditions = {
        "$and": [
            {"parent": None},  # This ensures we only get main posts, not replies
            {"$or": [
                {"title": {"$regex": query_text, "$options": "i"}},
                {"content": {"$regex": query_text, "$options": "i"}},
                {"user": {"$regex": query_text, "$options": "i"}},
                {"category": {"$regex": query_text, "$options": "i"}},
                {"animal_tags": {"$regex": query_text, "$options": "i"}}
            ]}
        ]
    }
    
    if location_filter != 'worldwide':
        search_query = {"$and": [{"location": location_filter}, search_conditions]}
    else:
        search_query = search_conditions
    
    if animal_filter:
        search_query = {"$and": [search_query, {"animal_tags": {"$regex": f"^{animal_filter}$", "$options": "i"}}]}
    
    search_results = list(db.posts.find(search_query))
    
    # Compute reply count for each post
    for p in search_results:
        p['reply_count'] = db.posts.count_documents({"parent": p['_id']})
    
    categories = db.posts.distinct("category")
    current_user = get_current_user()
    
    return render_template(
        'community.html',
        posts=search_results,
        current_user=current_user,
        sort_option='relevance',
        search_query=query_text,
        category_filter=None,
        location_filter=location_filter,
        animal_filter=animal_filter,
        categories=categories,
        available_locations=available_locations,
        available_animal_tags=available_animal_tags
    )


@app.route('/delete_post/<post_id>', methods=['POST'])
def delete_post(post_id):
    location_filter = request.args.get('location', 'worldwide')
    def find_all_replies(pid):
        child_ids = [pid]
        replies = list(db.posts.find({"parent": pid}))
        for reply in replies:
            child_ids.extend(find_all_replies(reply['_id']))
        return child_ids
    post_ids_to_delete = find_all_replies(post_id)
    result = db.posts.delete_many({"_id": {"$in": post_ids_to_delete}})
    if result.deleted_count > 0:
        flash(f'Post and {result.deleted_count - 1} replies have been deleted.', 'success')
    else:
        flash('Post not found or could not be deleted.', 'error')
    return redirect(url_for('community', location=location_filter))


@app.route('/user_profile/<username>')
def user_profile(username):
    user_posts = list(db.posts.find({"user": username, "parent": None}))
    user_posts.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
    post_count = len(user_posts)
    total_likes = sum(post.get('likes', 0) for post in db.posts.find({"user": username}))
    reply_count = db.posts.count_documents({"user": username, "parent": {"$ne": None}})
    current_user = get_current_user()
    return render_template(
        'user_profile.html',
        profile=current_user,
        posts=user_posts,
        post_count=post_count,
        reply_count=reply_count,
        total_likes=total_likes,
        available_locations=available_locations
    )


@app.route('/post/<post_id>')
def view_post(post_id):
    post = db.posts.find_one({"_id": post_id})
    if not post:
        flash("Post not found.", "error")
        return redirect(url_for("community"))
    def get_replies(pid):
        replies = list(db.posts.find({"parent": pid}))
        for reply in replies:
            reply['replies'] = get_replies(reply['_id'])
        replies.sort(key=lambda x: x.get('likes', 0), reverse=True)
        return replies
    post['replies'] = get_replies(post_id)
    current_user = get_current_user()
    return render_template('post_detail.html', post=post, current_user=current_user)

import json 

@app.route('/ai_help', methods=['GET', 'POST'])
def ai_help():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    # Get past conversations for this user
    past_conversations = []
    try:
        # Assuming you have a MongoDB collection for conversations
        past_conversations_data = db.conversations.find({"user_id": user["_id"]}).sort("timestamp", -1).limit(10)
        for conv in past_conversations_data:
            # Extract first question and truncate if too long
            first_question = ""
            if conv["history"] and len(conv["history"]) > 0:
                for entry in conv["history"]:
                    if entry["role"] == "user":
                        first_question = entry["content"]
                        if len(first_question) > 50:
                            first_question = first_question[:50] + "..."
                        break
            
            past_conversations.append({
                "id": str(conv["_id"]),
                "title": first_question or "Conversation",
                "timestamp": conv["timestamp"].strftime("%Y-%m-%d %H:%M"),
                "message_count": len(conv["history"])
            })
    except Exception as e:
        print(f"Error fetching past conversations: {e}")
    
    if request.method == 'POST':
        try:
            # Get the new question and conversation history
            question = request.form.get('question')
            conversation_history = request.form.get('conversation_history', '[]')
            conversation_id = request.form.get('conversation_id')
            
            # Parse the conversation history from JSON
            try:
                history = json.loads(conversation_history)
            except:
                history = []
            
            # Create a formatted conversation for Gemini
            formatted_conversation = ""
            for entry in history:
                if entry['role'] == 'user':
                    formatted_conversation += f"User: {entry['content']}\n\n"
                else:
                    formatted_conversation += f"Assistant: {entry['content']}\n\n"
            
            # Create the prompt with conversation context
            if history:
                prompt = f"""As a pet care expert, continue this conversation. Here's the conversation history:

{formatted_conversation}

User: {question}

IMPORTANT: Do not use any Markdown formatting in your response. Do not use asterisks (*) for emphasis or formatting. 
Instead, use plain text with paragraph breaks for organization. Use ALL CAPS for headings or important points."""
            else:
                prompt = f"""As a pet care expert, answer this question: {question}
                
IMPORTANT: Do not use any Markdown formatting in your response. Do not use asterisks (*) for emphasis or formatting. 
Instead, use plain text with paragraph breaks for organization. Use ALL CAPS for headings or important points."""
            
            # Generate response
            response = Gemini_client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt)
            
            answer_text = response.text
            
            # Add the new exchange to history
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": answer_text})
            
            # Save or update the conversation in the database
            now = datetime.now()
            
            if conversation_id:
                # Update existing conversation
                db.conversations.update_one(
                    {"_id": ObjectId(conversation_id), "user_id": user["_id"]},
                    {"$set": {"history": history, "updated_at": now}}
                )
            else:
                # Create new conversation
                conversation_id = str(db.conversations.insert_one({
                    "user_id": user["_id"],
                    "history": history,
                    "timestamp": now,
                    "updated_at": now
                }).inserted_id)
            
            # Return JSON response with answer and updated history
            return jsonify({
                "raw_schedule": answer_text,
                "conversation_history": history,
                "conversation_id": conversation_id
            })
            
        except Exception as e:
            print(f"Error in ai_help: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e), "raw_schedule": f"Error: {str(e)}"})
    
    # For GET requests, render the template with past conversations
    return render_template('ai_help.html', past_conversations=past_conversations)

@app.route('/get_conversation', methods=['GET'])
def get_conversation():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not logged in"})
    
    conversation_id = request.args.get('conversation_id')
    if not conversation_id:
        return jsonify({"error": "No conversation ID provided"})
    
    try:
        # Find the conversation in the database
        conversation = db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": user["_id"]
        })
        
        if not conversation:
            return jsonify({"error": "Conversation not found"})
        
        return jsonify({
            "history": conversation["history"]
        })
        
    except Exception as e:
        print(f"Error getting conversation: {e}")
        return jsonify({"error": str(e)})




@app.route('/generate_schedule', methods=['POST'])
def generate_schedule():
    user = get_current_user()
    if not user:
        if not user:
           return redirect(url_for('login'))
        
    data = request.json
    
    # Format the prompt for Gemini
    pets_info = ""
    for pet in data['pets']:
        pets_info += f"Pet: {pet['name']} ({pet['type']}, {pet['breed']}, {pet['age']} years old)\n"
        pets_info += f"- Feeding: {pet['feeding_schedule']}\n"
        if pet['walking_schedule'] and pet['walking_schedule'] != 'N/A':
            pets_info += f"- Walking: {pet['walking_schedule']}\n"
        pets_info += f"- Grooming: {pet['grooming_schedule']}\n"
        pets_info += f"- Treats: {pet['treat_time']}\n\n"
    
    prompt = f"""Create a detailed daily schedule for a pet owner on {data['date']} from {data['wakeTime']} to {data['sleepTime']}.
    
Pet information:
{pets_info}

Owner's schedule:
- At home: {data['homeTimes']}
- Outside (work/errands): {data['outsideTimes']}
- Additional activities planned: {data['activities'] if data['activities'] else 'None'}

Please create an hour-by-hour schedule that includes all pet care tasks (feeding, walking, grooming, etc.) integrated with the owner's daily routine. Make sure pet care activities happen when the owner is at home.

IMPORTANT: Format your response in the following structure:
1. Start with a line "==SUMMARY==" followed by a brief summary of the day
2. Then a line "==SCHEDULE==" followed by the hour-by-hour schedule
3. Each schedule item should be in the format "TIME - ACTIVITY"
4. End with a line "==TIPS==" followed by 2-3 pet care tips specific to this schedule

Example format:
==SUMMARY==
Brief summary here...

==SCHEDULE==
6:00 AM - Wake up and morning routine
6:30 AM - Feed Rex and Whiskers
...

==TIPS==
1. Tip one here
2. Tip two here
...
"""

    
    # Call Gemini API
    try:
        response = Gemini_client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt)
        schedule = response.text
        current_time = datetime.now()
        schedule_data = {
            'date': data['date'],
            'wakeTime': data['wakeTime'],
            'sleepTime': data['sleepTime'],
            'homeTimes': data['homeTimes'],
            'outsideTimes': data['outsideTimes'],
            'activities': data['activities'],
            'schedule': schedule,
            'generated_at': current_time.isoformat()
        }
        
        # Update user document with the new schedule
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_schedule": schedule_data}}
        )
        return jsonify({"raw_schedule": schedule})
    except Exception as e:
        print(f"Error in generate_schedule: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "raw_schedule": f"Error: {str(e)}"})

# Market Section

products = db['products']
cart_collection = db['cart']

@app.route('/market')
def market():
    user = get_current_user()
    
    sort = request.args.get('sort', 'name')
    order = request.args.get('order', 'asc')
    category = request.args.get('category', '')
    search = request.args.get('search', '')

    # Build the query
    query = {}
    if category:
        query['category'] = category
    
    # Add search functionality
    if search:
        # Create a case-insensitive search across multiple fields
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'category': {'$regex': search, '$options': 'i'}}
        ]

    # Sort the products
    if sort == 'price':
        sort_key = 'price'
    else:
        sort_key = 'name'

    sort_direction = 1 if order == 'asc' else -1

    items = list(products.find(query).sort(sort_key, sort_direction))
    categories = products.distinct('category')

    return render_template('market.html', items=items, categories=categories, user=user)


# Modify the cart collection structure to include user_id
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Please log in to add items to cart'})
    
    item_id = request.form.get('item_id')
    
    # Get the product details
    product = products.find_one({'_id': ObjectId(item_id)})
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'})
    
    # Check if the item is already in the user's cart
    cart_item = cart_collection.find_one({
        'user_id': ObjectId(user['_id']),
        'product_id': item_id
    })
    
    if cart_item:
        # Update quantity if already in cart
        cart_collection.update_one(
            {'_id': cart_item['_id']},
            {'$inc': {'quantity': 1}}
        )
    else:
        # Add new item to cart with user_id
        cart_collection.insert_one({
            'user_id': ObjectId(user['_id']),
            'product_id': item_id,
            'name': product['name'],
            'price': product['price'],
            'image_url': product.get('image_url', ''),
            'description': product.get('description', ''),
            'quantity': 1,
            'added_at': datetime.now()
        })
    
    return jsonify({'success': True, 'message': 'Item added to cart'})

@app.route('/cart')
def cart():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    # Fetch cart items for the current user
    cart_items = list(cart_collection.find({'user_id': ObjectId(user['_id'])}))
    
    # Calculate total
    total = sum(item['price'] * item['quantity'] for item in cart_items)
    
    return render_template('cart.html', items=cart_items, total=total)



@app.route('/update_cart', methods=['POST'])
def update_cart():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not logged in'})
    
    item_id = request.form.get('item_id')
    action = request.form.get('action')
    
    # Check if this is an AJAX request
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    
    try:
        # Verify the cart item belongs to the current user
        cart_item = cart_collection.find_one({
            '_id': ObjectId(item_id),
            'user_id': ObjectId(user['_id'])
        })
        
        if not cart_item:
            if is_ajax:
                return jsonify({'success': False, 'message': 'Item not found in your cart'})
            return redirect(url_for('cart'))
        
        item = None
        item_quantity = 0
        item_total = 0
        
        if action == 'increase':
            # Increase quantity
            cart_collection.update_one(
                {'_id': ObjectId(item_id)},
                {'$inc': {'quantity': 1}}
            )
            
            # Get updated item
            item = cart_collection.find_one({'_id': ObjectId(item_id)})
            if item:
                item_quantity = item['quantity']
                item_total = item['price'] * item['quantity']
            
        elif action == 'decrease':
            # Get current quantity
            if cart_item['quantity'] > 1:
                # Decrease quantity
                cart_collection.update_one(
                    {'_id': ObjectId(item_id)},
                    {'$inc': {'quantity': -1}}
                )
                # Get updated item
                item = cart_collection.find_one({'_id': ObjectId(item_id)})
                if item:
                    item_quantity = item['quantity']
                    item_total = item['price'] * item['quantity']
            else:
                # Remove item if quantity would be 0
                cart_collection.delete_one({'_id': ObjectId(item_id)})
                item_quantity = 0
                item_total = 0
                
        elif action == 'remove':
            # Remove item completely
            cart_collection.delete_one({'_id': ObjectId(item_id)})
            item_quantity = 0
            item_total = 0
        
        # Get updated cart information for the current user
        cart_items = list(cart_collection.find({'user_id': ObjectId(user['_id'])}))
        subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
        total = subtotal + 5.99  # Adding shipping cost
        
        # If this is an AJAX request, return JSON
        if is_ajax:
            return jsonify({
                'success': True,
                'item_quantity': item_quantity,
                'item_total': item_total,
                'subtotal': subtotal,
                'total': total,
                'items_count': len(cart_items)
            })
        
        # Otherwise redirect back to cart page
        return redirect(url_for('cart'))
        
    except Exception as e:
        if is_ajax:
            return jsonify({
                'success': False,
                'message': str(e)
            })
        return redirect(url_for('cart'))

@app.route('/clear_cart')
def clear_cart():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    # Only delete cart items belonging to the current user
    cart_collection.delete_many({'user_id': ObjectId(user['_id'])})
    return redirect(url_for('cart'))

@app.route('/item/<item_id>')
def item(item_id):
    item = products.find_one({'_id': ObjectId(item_id)})
    return render_template('item.html', item=item)


@app.route('/checkout')
def checkout():
    user = get_current_user()
    if not user:
        return redirect(url_for('login'))
    
    # Get the user's cart items
    cart_items = list(cart_collection.find({'user_id': ObjectId(user['_id'])}))
    
    if not cart_items:
        flash('Your cart is empty', 'warning')
        return redirect(url_for('cart'))
    
    # Calculate total
    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    shipping = 5.99
    total = subtotal + shipping
    
    # This would typically process the order and payment
    # For now, just clear the cart and show a message
    cart_collection.delete_many({'user_id': ObjectId(user['_id'])})
    
    return render_template('checkout.html', 
                          user=user, 
                          items=cart_items, 
                          subtotal=subtotal,
                          shipping=shipping,
                          total=total)

@app.route('/api/cart')
def api_cart():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'User not logged in'})
    
    cart_items = list(cart_collection.find({'user_id': ObjectId(user['_id'])}))
    
    # Convert ObjectId to string for JSON serialization
    for item in cart_items:
        item['_id'] = str(item['_id'])
        item['user_id'] = str(item['user_id'])
    
    return jsonify({'items': cart_items})

@app.route('/api/cart/count')
def api_cart_count():
    user = get_current_user()
    if not user:
        return jsonify({'count': 0})
    
    count = cart_collection.count_documents({'user_id': ObjectId(user['_id'])})
    return jsonify({'count': count})

@app.route('/init_db')
def init_db():
    # Clear existing products
    products.delete_many({})
    
    # Sample products
    sample_products = [
        {
            "name": "Premium Dog Food",
            "price": 29.99,
            "description": "High-quality dog food for all breeds. Made with real chicken and vegetables, this premium dog food provides all the nutrients your furry friend needs for a healthy and active lifestyle.",
            "category": "dog",
            "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Cat Toy Set",
            "price": 15.99,
            "description": "A set of interactive toys for cats. Includes feather wands, balls with bells, and catnip-filled mice that will keep your feline friend entertained for hours.",
            "category": "cat",
            "image_url": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Fish Tank Filter",
            "price": 39.99,
            "description": "Efficient filter for aquariums up to 50 gallons. This three-stage filtration system keeps your aquarium water crystal clear and provides a healthy environment for your fish.",
            "category": "fish",
            "image_url": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Bird Cage",
            "price": 49.99,
            "description": "Spacious cage for small to medium-sized birds. Features multiple perches, feeding stations, and a swing for your feathered friend to enjoy.",
            "category": "bird",
            "image_url": "https://images.unsplash.com/photo-1552728089-57bdde30beb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Hamster Wheel",
            "price": 12.99,
            "description": "Silent spinner wheel for hamsters and other small pets. The smooth-running design ensures your pet can exercise without disturbing your sleep.",
            "category": "small_pet",
            "image_url": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Dog Collar",
            "price": 9.99,
            "description": "Adjustable collar for dogs of all sizes. Made from durable nylon with a secure buckle and ID tag attachment.",
            "category": "dog",
            "image_url": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Cat Scratching Post",
            "price": 24.99,
            "description": "Tall scratching post with a plush perch. Helps protect your furniture while giving your cat a dedicated place to scratch and relax.",
            "category": "cat",
            "image_url": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            "name": "Reptile Heat Lamp",
            "price": 18.99,
            "description": "Adjustable heat lamp for reptile terrariums. Provides the warmth your cold-blooded pet needs to thrive.",
            "category": "reptile",
            "image_url": "https://images.unsplash.com/photo-1591871937573-74dbba515c4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
    ]
    
    products.insert_many(sample_products)
    return "Database initialized with sample products!"


if __name__ == '__main__':
    app.run(debug=True)