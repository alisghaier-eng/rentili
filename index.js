const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/user");
const Car = require("./models/Car");
const Rental = require("./models/rental");
const multer = require("multer");
const path = require("path");
const Cart =require("./models/card")
const app = express();
const port = 6000;
const secretkey = "rentili";
const cart=require("./models/card")


const corsOptions = {
  origin: "http://192.168.9.57",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
  .connect("mongodb+srv://alisghaieribenmansour:vzFCBHXg3ySVRbk7@cluster0.htwun.mongodb.net/")
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

 
  
  const authenticateUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized access. Token is missing." });
      }
  
      const decoded = jwt.verify(token, secretkey);
      const user = await User.findById(decoded.userId);
  
      if (!user) {
        return res.status(403).json({ message: "Invalid token. User not found." });
      }
  
      req.user = user; // Attache l'utilisateur à la requête
      next();
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      return res.status(401).json({ message: "Unauthorized access." });
    }
  };
  
  
// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));  // Dossier où les images seront sauvegardées
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nom unique pour chaque fichier
  },
});

// Filtrage des fichiers pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// Modification de la route POST /cars pour gérer les images
app.post("/cars", authenticateUser, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "agence") {
      return res.status(403).json({ message: "Access denied. Only agencies can add cars." });
    }

    const { model, priceperday, licensePlate, transmission } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Vérification des champs requis
    if (!model || !priceperday || !licensePlate || !transmission || !req.file) {
      return res.status(400).json({ message: "All fields, including an image, are required." });
    }

    // Création d'une nouvelle voiture
    const newCar = new Car({
      model,
      priceperday,
      image: `http://192.168.9.57:6000${imagePath}`, // Stockage du chemin de l'image
      licensePlate,
      transmission,
      agency: req.user._id,
    });

    // Sauvegarde dans la base de données
    await newCar.save();

    res.status(201).json({ message: "Car added successfully", car: newCar });
  } catch (err) {
    console.error("Error adding car:", err);
    res.status(500).json({ message: "An error occurred while adding the car." });
  }
});

  

// Route: Get all cars
app.get("/cars", async (req, res) => {
  try {
    const cars = await Car.find().populate("agency", "email");
    if (cars.length === 0) {
      return res.status(404).json({ message: "No cars available." });
    }
    res.status(200).json(cars);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ message: "An error occurred while fetching cars." });
  }
});

// Route: Get car by ID
app.get("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("agency", "email");
    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }
    res.status(200).json(car);
  } catch (err) {
    console.error("Error fetching car details:", err);
    res.status(500).json({ message: "An error occurred while fetching car details." });
  }
});
// Route: Get cars for a specific agency
// Route: Get cars for a specific agency
app.get("/carsagency", async (req, res) => {
  try {
    // Récupérer l'ID de l'agence depuis la requête (par exemple depuis req.query ou req.user)
    const agencyId = req.query.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: "L'ID de l'agence est requis." });
    }

    // Trouver les voitures associées à cette agence
    const cars = await Car.find({ agency: agencyId }).populate("agency", "email");

    if (cars.length === 0) {
      return res.status(404).json({ message: "Aucune voiture trouvée pour cette agence." });
    }

    res.status(200).json(cars);
  } catch (err) {
    console.error("Erreur lors de la récupération des voitures:", err);
    res.status(500).json({ message: "Une erreur est survenue lors de la récupération des voitures." });
  }
});
app.put('/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const updates = req.body;

    const updatedCar = await Car.findByIdAndUpdate(carId, updates, { new: true });

    if (!updatedCar) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    res.status(200).json({ message: 'Les détails de la voiture ont été mis à jour avec succès', car: updatedCar });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la voiture:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la voiture' });
  }
});

// Supprimer une voiture
app.delete('/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;

    const deletedCar = await Car.findByIdAndDelete(carId);

    if (!deletedCar) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    res.status(200).json({ message: 'La voiture a été supprimée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de la voiture:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la voiture' });
  }
});

// Route: Create a rental
// Route: Create a rental
app.post("/rentals", authenticateUser, async (req, res) => {
  try {
    // Vérification que l'utilisateur est un client
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Access denied. Only clients can create rentals." });
    }

    const { carId, startDate, endDate, withDriver, destination } = req.body;

    // Validation des champs requis
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: "Car ID, startDate, and endDate are required." });
    }

    // Vérification de l'existence de la voiture
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }

    // Vérification de la disponibilité de la voiture pour les dates demandées
    const overlappingRental = await Rental.findOne({
      car: carId,
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } },
      ],
    });
    if (overlappingRental) {
      return res.status(400).json({ message: "Car is already rented for the selected dates." });
    }

    // Calcul de la durée et vérification des dates
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return res.status(400).json({ message: "Invalid start or end dates." });
    }

    // Calcul du prix total
    const totalPrice = days * car.priceperday;

    // Création d'une nouvelle location
    const rentalData = {
      car: carId,
      client: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      withDriver: withDriver || false,
    };

    // Ajouter la destination si un chauffeur est demandé
    if (withDriver && destination) {
      rentalData.destination = destination;
    }

    const rental = new Rental(rentalData);

    // Sauvegarde dans la base de données
    await rental.save();

    // Mettre à jour la disponibilité de la voiture
    car.availability = false;
    await car.save();

    // Planifier un changement de disponibilité une fois la période de location terminée
    const endTime = new Date(endDate).getTime();
    const currentTime = Date.now();

    if (endTime > currentTime) {
      const delay = endTime - currentTime; // Calcul du délai en millisecondes

      setTimeout(async () => {
        try {
          car.availability = true;
          await car.save();
          console.log(`Car ${carId} is now available again.`);
        } catch (err) {
          console.error("Error updating car availability:", err);
        }
      }, delay);
    }

    // Réponse avec succès
    res.status(201).json({ message: "Rental created successfully.", rental });
  } catch (err) {
    console.error("Error creating rental:", err);

    // Gestion d'erreurs génériques
    res.status(500).json({
      message: err.message || "An error occurred while creating the rental.",
    });
  }
});
app.get("/rentals/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id; // L'ID est extrait dans le middleware authenticateUser

    // Récupération des locations de l'utilisateur
    const rentals = await Rental.find({ client: userId })
      .select("startDate endDate totalPrice car") // Inclure les champs nécessaires, y compris totalPrice
      .populate({
        path: "car", // Peuplement des informations de la voiture
        select: "model priceperday image agency",
        populate: {
          path: "agency", // Peuplement des informations de l'agence
          select: "agencyName", // Inclure uniquement le nom de l'agence
        },
      })
      .sort({ startDate: -1 });

    if (!rentals.length) {
      return res.status(200).json({ rentals: [] });
    }

    res.status(200).json({ rentals });
  } catch (err) {
    console.error("Error fetching rentals:", err);

    res.status(500).json({
      message: "An error occurred while fetching rentals.",
    });
  }
});



app.get("/rentals/:carId", authenticateUser, async (req, res) => {
  const { carId } = req.params;

  try {
    // Recherche de la location basée sur l'ID de la voiture
    const rental = await Rental.findOne({ car: carId })
      .populate("client", "name email") // Récupère le nom et l'email du client
      .populate("car", "model") // Récupère le modèle de la voiture
      .select("startDate endDate car client");

    if (!rental) {
      return res.status(404).json({ message: "Aucune location trouvée pour cette voiture." });
    }

    const { client, car, startDate, endDate } = rental;

    // Formater les dates en une forme lisible
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();

    // Préparer la notification
    const notificationMessage = `${client.name} a loué la voiture ${car.model} du ${start} au ${end}`;

    res.status(200).json({
      message: notificationMessage,
      rentalDetails: {
        clientName: client.name,
        carModel: car.model,
        startDate: start,
        endDate: end,
      }
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de location :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});
// Récupération de toutes les agences
app.get("/agencies", async (req, res) => {
  try {
    // Récupérer toutes les agences avec le rôle "agence"
    const agencies = await User.find({ role: "agence" }).select("agencyName latitude longitude");

    res.status(200).json({ agencies });
  } catch (err) {
    console.error("Error fetching agencies:", err);
    res.status(500).json({ message: "An error occurred while fetching agencies." });
  }
});
// Récupération des informations d'une agence par ID
app.get("/agencies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Récupérer l'agence par son ID et inclure uniquement les champs nécessaires
    const agency = await User.findById(id).select(
      "email phoneNumber agencyName latitude longitude"
    );

    if (!agency) {
      return res.status(404).json({ message: "Agence non trouvée." });
    }

    res.status(200).json({ agency });
  } catch (err) {
    console.error("Erreur lors de la récupération de l'agence :", err);
    res.status(500).json({ message: "Une erreur est survenue lors de la récupération de l'agence." });
  }
});


app.post("/signUp", upload.single('profileImage'), async (req, res) => {
  try {
    const { 
      role,firstname,lastname, email, password, phoneNumber, birthDate, gender, agencyId, agencyName, latitude, longitude
    } = req.body;

    // Vérification des champs obligatoires
    if (!email || !password || !role || !phoneNumber) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "agence") {
      if (!latitude || !longitude || !agencyId || !agencyName) {
        return res.status(400).json({ message: "Agency details (ID, Name, Latitude, Longitude) are required." });
      }
    }

    if (role === "client") {
      if (!birthDate || !gender || !req.file) {
        return res.status(400).json({ message: "Client details (BirthDate, Gender, ProfileImage) are required." });
      }
    }

    const profileImage = req.file ? `/uploads/${req.file.filename}` : null; // Chemin de l'image téléchargée

    const newUser = new User({
      role,
      firstname:role==="client" ? firstname:null,
      lastname:role==="client" ?lastname:null,
      email,
      password: hashedPassword,
      phoneNumber,
      birthDate: role === "client" ? birthDate : null,
      gender: role === "client" ? gender : null,
      profileImage: role === "client" ? profileImage : null, // Enregistrer l'URL de l'image
      agencyId: role === "agence" ? agencyId : null,
      agencyName: role === "agence" ? agencyName : null,
      latitude: role === "agence" ? latitude : null,
      longitude: role === "agence" ? longitude : null,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });

  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "An error occurred during signup." });
  }
});

// Route: User login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Création du token JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, secretkey, { expiresIn: "1h" });

    // Si l'utilisateur est une agence, on récupère son ID
    let agencyId = null;
    if (user.role === "agence") {
      agencyId = user._id; // Récupère l'ID de l'agence directement de l'utilisateur
    }

    // Envoi de la réponse avec le token, le rôle et l'ID de l'agence si applicable
    res.status(200).json({ token, role: user.role, agencyId: agencyId });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Error during login." });
  }
});

// Exemple de route pour récupérer les informations de l'utilisateur
app.get('/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token dans l'en-tête Authorization

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    // Vérification du token JWT et récupération de l'utilisateur
    const decoded = jwt.verify(token, secretkey); // Vérification du token

    const user = await User.findById(decoded.userId); // Récupération des données utilisateur

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json(user); // Réponse avec les données utilisateur
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
app.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
app.put('/user', authenticateUser, async (req, res) => {
  const { email, phoneNumber, birthDate, gender } = req.body;

  try {
    // Rechercher l'utilisateur par son ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérification si l'email existe déjà pour un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    // Mise à jour des champs
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.birthDate = birthDate || user.birthDate;
    user.gender = gender || user.gender;

    // Enregistrer les changements
    await user.save();

    res.json(user); // Retourner l'utilisateur mis à jour
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
app.post('/cart', async (req, res) => {
  const { userId, carId } = req.body;

  // Vérification des paramètres
  if (!userId || !carId) {
    return res.status(400).json({ error: 'userId et carId sont requis.' });
  }

  // Vérifie si userId et carId sont des ObjectId valides
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ error: 'userId ou carId sont invalides.' });
  }

  try {
    // Vérifie si l'utilisateur a déjà ajouté cette voiture au panier
    const existingItem = await Cart.findOne({ userId, carId });

    if (existingItem) {
      return res.status(400).json({ message: 'Cette voiture est déjà dans le chariot.' });
    }

    // Crée un nouvel élément du chariot
    const cartItem = new Cart({
      userId: new mongoose.Types.ObjectId(userId),  // Utilisez "new" pour créer un ObjectId
      carId: new mongoose.Types.ObjectId(carId),    // Utilisez "new" pour créer un ObjectId
    });

    // Sauvegarde l'élément du chariot dans la base de données
    await cartItem.save();

    return res.status(201).json({ message: 'Voiture ajoutée au chariot.', cartItem });
  } catch (error) {
    console.error('Erreur lors de l\'ajout au chariot:', error.message);  // Plus détaillé
    return res.status(500).json({ error: 'Erreur interne du serveur. ' + error.message });  // Inclure le message d'erreur pour plus de détails
  }
});
app.get('/cart', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Récupérer le token JWT

  if (!token) {
    return res.status(401).json({ error: 'Token manquant. Vous devez être connecté.' });
  }

  try {
    // Décoder et vérifier le token
    const decoded = jwt.verify(token, secretkey);
    const userId = decoded.userId; // Assurez-vous que le payload du token contient "userId"

    if (!userId) {
      return res.status(400).json({ error: 'Utilisateur non valide.' });
    }

    // Récupérer les articles du panier pour cet utilisateur
    const cartItems = await cart
      .find({ userId }) // Filtrer par userId
      .populate('carId') // Populer les détails des voitures (assurez-vous que le champ "carId" est correct)
      .exec();

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: 'Aucun article trouvé dans le panier.' });
    }

    // Réponse avec les articles du panier
    return res.status(200).json({ cartItems });
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error.message);

    // Gestion des erreurs spécifiques JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.' });
    }

    // Autres erreurs serveur
    return res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer plus tard.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
