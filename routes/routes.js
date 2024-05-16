const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../model/User");
//const Notification = require("../model/Notification");
const Report = require("../model/Report");
//const Role = require("../model/Role");
const Safety = require("../model/Safety");
const SecurityZone = require("../model/SafeZone");
//const Settings = require("../model/Settings");
const Status = require("../model/Status");
const ActivityLog = require("../model/ActivityLog");
const Alert = require("../model/Alert");
const DangerZone = require("../model/DangerZone"); 
const SafeZone = require("../model/SafeZone"); 
const DangerMarker = require("../model/DangerMarker");
const SafetyMarker = require("../model/SafetyMarker");

router.post("/register", async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists. Try another username." });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      username: req.body.username,
      password: hashedPassword,
      isAdmin: req.body.isAdmin || false,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.isAdmin ? "admin" : "user" }, "mySecretKey123");

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/userslogin", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: "Admin login not allowed from this app" });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.isAdmin ? "admin" : "user" }, "mySecretKey123");
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});


// Add this to your Express router

router.get("/user/role", async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(' ')[1]; // Assuming Bearer schema
    const decoded = jwt.verify(token, "mySecretKey123");
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the user's role
    res.json({ role: user.isAdmin ? "admin" : "user" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying user role", error });
  }
});


router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ username: { $regex: query, $options: 'i' } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...userData } = req.body;
    const user = await User.findById(id);

    // Check if the user is an admin
    if (!user.isAdmin) {
      // If not an admin, proceed with the update directly
      const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
      return res.json(updatedUser);
    }

    // If the user is an admin, prompt for password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Password match, proceed with the update
    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// DANGER ZONES ROUTES
router.get("/dangerzones", async (req, res) => {
  try {
    const dangerZones = await DangerZone.find().populate("markers");
    res.json(dangerZones);
  } catch (error) {
    console.error("Error fetching danger zones:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/dangerzones/add", async (req, res) => {
  try {
    const { markers } = req.body;
    if (!Array.isArray(markers) || markers.length !== 10) {
      return res.status(400).json({ error: "Exactly 10 markers are required." });
    }

    // Create markers and associate them with the zone
    const markerDocs = await DangerMarker.insertMany(
      markers.map((marker) => ({ ...marker }))
    );

    // Create the zone and link marker IDs
    const createdZone = await DangerZone.create({
      markers: markerDocs.map((marker) => marker._id)
    });

    res.status(201).json({
      success: true,
      message: "Danger zone added successfully",
      data: createdZone
    });
  } catch (error) {
    console.error("Error adding danger zone:", error);
    res.status(500).json({ success: false, error: "Failed to add danger zone" });
  }
});


router.get("/dangerzones/:id", async (req, res) => {
  try {
    const dangerZone = await DangerZone.findById(req.params.id).populate(
      "markers"
    );
    if (!dangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json(dangerZone);
  } catch (error) {
    console.error("Error fetching danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/dangerzones/:id", async (req, res) => {
  try {
    const { markers } = req.body;
    if (markers && markers.length === 10) {
      await DangerMarker.deleteMany({ zone: req.params.id });
      const markerDocs = await DangerMarker.insertMany(
        markers.map((marker) => ({ ...marker, zone: req.params.id }))
      );
      req.body.markers = markerDocs.map((marker) => marker._id);
    }

    const updatedDangerZone = await DangerZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("markers");
    if (!updatedDangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json(updatedDangerZone);
  } catch (error) {
    console.error("Error updating danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/dangerzones/:id", async (req, res) => {
  try {
    const zoneId = req.params.id;

    // Delete associated markers
    await DangerMarker.deleteMany({ zone: zoneId });

    // Delete the zone itself
    const deletedZone = await DangerZone.findByIdAndDelete(zoneId);
    if (!deletedZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json({
      message: "Danger zone and associated markers deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DANGER MARKERS ROUTES
router.get("/dangermarkers", async (req, res) => {
  try {
    const dangerMarkers = await DangerMarker.find();
    res.json(dangerMarkers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/dangermarkers/add", async (req, res) => {
  try {
    const { coordinates, description } = req.body;
    const newMarker = await DangerMarker.create({ coordinates, description });
    res.status(201).json({
      success: true,
      message: "Danger marker added successfully",
      data: newMarker,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add danger marker" });
  }
});

router.put("/dangermarkers/:id", async (req, res) => {
  try {
    const updatedDangerMarker = await DangerMarker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDangerMarker) {
      return res.status(404).json({ message: "Danger marker not found" });
    }
    res.json(updatedDangerMarker);
  } catch (error) {
    console.error("Error updating danger marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/dangermarkers/:id", async (req, res) => {
  try {
    const deletedMarker = await DangerMarker.findOneAndDelete({ _id: req.params.id });
    if (!deletedMarker) {
      return res.status(404).json({ message: "Danger marker not found" });
    }
    res.json({ message: "Danger marker deleted successfully" });
  } catch (error) {
    console.error("Error deleting danger marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// SAFE ZONES ROUTES
router.get("/safezones", async (req, res) => {
  try {
    const safeZones = await SafeZone.find().populate("markers");
    res.json(safeZones);
  } catch (error) {
    console.error("Error fetching safe zones:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/safezones/add", async (req, res) => {
  try {
    const { markers } = req.body;
    if (!Array.isArray(markers) || markers.length !== 10) {
      return res
        .status(400)
        .json({ error: "Exactly 10 markers are required." });
    }

    // Create markers and associate them with the zone
    const markerDocs = await SafetyMarker.insertMany(
      markers.map((marker) => ({ ...marker }))
    );

    // Create the zone and link marker IDs
    const createdZone = await SafeZone.create({
      markers: markerDocs.map((marker) => marker._id),
    });

    res.status(201).json({
      success: true,
      message: "Safe zone added successfully",
      data: createdZone,
    });
  } catch (error) {
    console.error("Error adding safe zone:", error);
    res.status(500).json({ success: false, error: "Failed to add safe zone" });
  }
});

router.get("/safezones/:id", async (req, res) => {
  try {
    const safeZone = await SafeZone.findById(req.params.id).populate("markers");
    if (!safeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }
    res.json(safeZone);
  } catch (error) {
    console.error("Error fetching safe zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/safezones/:id", async (req, res) => {
  try {
    const { markers } = req.body;
    if (markers && markers.length === 10) {
      await SafetyMarker.deleteMany({ zone: req.params.id });
      const markerDocs = await SafetyMarker.insertMany(
        markers.map((marker) => ({ ...marker, zone: req.params.id }))
      );
      req.body.markers = markerDocs.map((marker) => marker._id);
    }

    const updatedSafeZone = await SafeZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("markers");
    if (!updatedSafeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }
    res.json(updatedSafeZone);
  } catch (error) {
    console.error("Error updating safe zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/safezones/:id", async (req, res) => {
  try {
    const zoneId = req.params.id;

    // Delete associated markers
    await SafetyMarker.deleteMany({ zone: zoneId });

    // Delete the zone itself
    const deletedZone = await SafeZone.findByIdAndDelete(zoneId);
    if (!deletedZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }
    res.json({
      message: "Safe zone and associated markers deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting safe zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// SAFETY MARKERS ROUTES
router.get("/safetymarkers", async (req, res) => {
  try {
    const safetyMarkers = await SafetyMarker.find();
    res.json(safetyMarkers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/safetymarkers/add", async (req, res) => {
  try {
    const { coordinates, description } = req.body;
    const newMarker = await SafetyMarker.create({ coordinates, description });
    res.status(201).json({
      success: true,
      message: "Safety marker added successfully",
      data: newMarker,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add safety marker" });
  }
});

router.put("/safetymarkers/:id", async (req, res) => {
  try {
    const updatedSafetyMarker = await SafetyMarker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedSafetyMarker) {
      return res.status(404).json({ message: "Safety marker not found" });
    }
    res.json(updatedSafetyMarker);
  } catch (error) {
    console.error("Error updating safety marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/safetymarkers/:id", async (req, res) => {
  try {
    const deletedMarker = await SafetyMarker.findOneAndDelete({ _id: req.params.id });
    if (!deletedMarker) {
      return res.status(404).json({ message: "Safety marker not found" });
    }
    res.json({ message: "Safety marker deleted successfully" });
  } catch (error) {
    console.error("Error deleting safety marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/activityLogs", async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find();
    res.json(activityLogs);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/activityLogs", async (req, res) => {
  try {
    const newActivityLog = await ActivityLog.create(req.body);
    res.status(201).json(newActivityLog);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/activityLogs/:id", async (req, res) => {
  try {
    const activityLog = await ActivityLog.findById(req.params.id);
    if (!activityLog) {
      return res.status(404).json({ message: "Activity log not found" });
    }
    res.json(activityLog);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/activityLogs/:id", async (req, res) => {
  try {
    const updatedActivityLog = await ActivityLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedActivityLog) {
      return res.status(404).json({ message: "Activity log not found" });
    }
    res.json(updatedActivityLog);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/activityLogs/:id", async (req, res) => {
  try {
    const deletedActivityLog = await ActivityLog.findByIdAndDelete(
      req.params.id
    );
    if (!deletedActivityLog) {
      return res.status(404).json({ message: "Activity log not found" });
    }
    res.json({ message: "Activity log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/alerts", async (req, res) => {
  try {
    const newAlert = await Alert.create(req.body);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/alerts/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/alerts/:id", async (req, res) => {
  try {
    const updatedAlert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAlert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    res.json(updatedAlert);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/alerts/:id", async (req, res) => {
  try {
    const deletedAlert = await Alert.findByIdAndDelete(req.params.id);
    if (!deletedAlert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/dangerpoints", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const newDangerPoint = await DangerPoint.create({ latitude, longitude });

    res.status(201).json(newDangerPoint);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
