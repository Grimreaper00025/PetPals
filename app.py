from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from flask_bcrypt import Bcrypt
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.urandom(24)
app.config["MONGO_URI"] = "mongodb://localhost:27017/petpals"
mongo = PyMongo(app)
bcrypt = Bcrypt(app)

# Pet types and their breeds
PET_BREEDS = {
    "dog": ["Labrador", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle", "Beagle", "Chihuahua", "Husky", "Dachshund", "Mixed Breed"],
    "cat": ["Persian", "Maine Coon", "Siamese", "Bengal", "Ragdoll", "Scottish Fold", "Sphynx", "Abyssinian", "British Shorthair", "Mixed Breed"],
    "bird": ["Parakeet", "Cockatiel", "Canary", "Lovebird", "Parrot", "Finch", "Macaw", "Conure", "Cockatoo", "Other"],
    "fish": ["Goldfish", "Betta", "Guppy", "Angelfish", "Tetra", "Cichlid", "Molly", "Discus", "Koi", "Other"],
    "rabbit": ["Holland Lop", "Mini Rex", "Dutch", "Netherland Dwarf", "Lionhead", "English Angora", "Flemish Giant", "Rex", "Mini Lop", "Mixed Breed"],
    "hamster": ["Syrian", "Dwarf Campbell", "Winter White", "Roborovski", "Chinese", "Other"]
}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/get_breeds/<pet_type>')
def get_breeds(pet_type):
    if pet_type in PET_BREEDS:
        return jsonify(PET_BREEDS[pet_type])
    return jsonify([])

@app.route('/pet_info', methods=['GET', 'POST'])
def pet_info():
    if request.method == 'POST':
        pet_data = {
            'type': request.form.get('pet_type'),
            'name': request.form.get('pet_name'),
            'breed': request.form.get('pet_breed'),
            'age': request.form.get('pet_age'),
            'weight': request.form.get('pet_weight'),
            'vaccinated': request.form.get('vaccinated') == 'on',
            'created_at': datetime.now()
        }
        
        # Store pet data in session for later use after user signup/login
        session['pet_data'] = pet_data
        return redirect(url_for('signup'))
        
    return render_template('pet_info.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        existing_user = mongo.db.users.find_one({'email': request.form.get('email')})
        
        if existing_user is None:
            # Hash the password
            hashed_password = bcrypt.generate_password_hash(request.form.get('password')).decode('utf-8')
            
            # Create new user
            user_id = mongo.db.users.insert_one({
                'name': request.form.get('name'),
                'email': request.form.get('email'),
                'password': hashed_password,
                'created_at': datetime.now()
            }).inserted_id
            
            # Add pet data if available
            if 'pet_data' in session:
                pet_data = session.pop('pet_data')
                pet_data['user_id'] = user_id
                mongo.db.pets.insert_one(pet_data)
            
            # Log the user in
            session['user_id'] = str(user_id)
            flash('Account created successfully!', 'success')
            return redirect(url_for('dashboard'))
            
        flash('Email already exists!', 'danger')
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = mongo.db.users.find_one({'email': request.form.get('email')})
        
        if user and bcrypt.check_password_hash(user['password'], request.form.get('password')):
            session['user_id'] = str(user['_id'])
            
            # Add pet data if available
            if 'pet_data' in session:
                pet_data = session.pop('pet_data')
                pet_data['user_id'] = user['_id']
                mongo.db.pets.insert_one(pet_data)
                
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard'))
            
        flash('Invalid email or password!', 'danger')
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user = mongo.db.users.find_one({'_id': ObjectId(session['user_id'])})
    pets = list(mongo.db.pets.find({'user_id': ObjectId(session['user_id'])}))
    
    return render_template('dashboard.html', user=user, pets=pets)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)