const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../model/User");
//const Notification = require("../model/Notification");
const Report = require("../model/Report");
//const Role = require("../model/Role");
const Safety = require("../model/Safety");
const SecurityZone = require("../model/SecurityZone");
//const Settings = require("../model/Settings");
const Status = require("../model/Status");
const ActivityLog = require("../model/ActivityLog");
const Alert = require("../model/Alert");
const DangerZone = require("../model/DangerZone"); 

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

router.get("/securityzones", async (req, res) => {
  try {
    const securityZones = await SecurityZone.find();
    res.json(securityZones);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/securityzones", async (req, res) => {
  try {
    const newSecurityZone = await SecurityZone.create(req.body);
    res.status(201).json(newSecurityZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/securityzones/:id", async (req, res) => {
  try {
    const securityZone = await SecurityZone.findById(req.params.id);
    if (!securityZone) {
      return res.status(404).json({ message: "Security zone not found" });
    }
    res.json(securityZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/securityzones/:id", async (req, res) => {
  try {
    const updatedSecurityZone = await SecurityZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedSecurityZone) {
      return res.status(404).json({ message: "Security zone not found" });
    }
    res.json(updatedSecurityZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/securityzones/:id", async (req, res) => {
  try {
    const deletedSecurityZone = await SecurityZone.findByIdAndDelete(
      req.params.id
    );
    if (!deletedSecurityZone) {
      return res.status(404).json({ message: "Security zone not found" });
    }
    res.json({ message: "Security zone deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve all danger zones
router.get("/dangerzones", async (req, res) => {
  try {
    const dangerZones = await DangerZone.find();
    res.json(dangerZones);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new danger zone
router.post("/dangerzones", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const newDangerZone = await DangerZone.create({ latitude, longitude });
    res.status(201).json(newDangerZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieve a specific danger zone by ID
router.get("/dangerzones/:id", async (req, res) => {
  try {
    const dangerZone = await DangerZone.findById(req.params.id);
    if (!dangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json(dangerZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a specific danger zone by ID
router.put("/dangerzones/:id", async (req, res) => {
  try {
    const updatedDangerZone = await DangerZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json(updatedDangerZone);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a specific danger zone by ID
router.delete("/dangerzones/:id", async (req, res) => {
  try {
    const deletedDangerZone = await DangerZone.findByIdAndDelete(req.params.id);
    if (!deletedDangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json({ message: "Danger zone deleted successfully" });
  } catch (error) {
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
