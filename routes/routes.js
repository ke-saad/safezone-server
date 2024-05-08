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

router.get("/safezones", async (req, res) => {
  try {
    const safezones = await SecurityZone.find();
    res.json(safezones);
  } catch (error) {
    console.error("Error fetching security zones:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/safezones/add", async (req, res) => {
  try {
    const { markers } = req.body;  // Each marker has only coordinates
    if (markers.length !== 10) {
      return res.status(400).json({ error: "Exactly 10 markers are required." });
    }
    const createdZones = await SafeZone.create({ markers });
    res.status(201).json({ success: true, message: "Safe zones added successfully", data: createdZones });
  } catch (error) {
    console.error("Error adding safe zones:", error);
    res.status(500).json({ success: false, error: "Failed to add safe zones" });
  }
});

router.get("/safezones/:id", async (req, res) => {
  try {
    const securityZone = await SecurityZone.findById(req.params.id);
    if (!securityZone) {
      return res.status(404).json({ message: "Security zone not found" });
    }
    res.json(securityZone);
  } catch (error) {
    console.error("Error fetching security zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/safezones/:id", async (req, res) => {
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
    console.error("Error updating security zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/safezones/:id", async (req, res) => {
  try {
    const deletedSecurityZone = await SecurityZone.findByIdAndDelete(
      req.params.id
    );
    if (!deletedSecurityZone) {
      return res.status(404).json({ message: "Security zone not found" });
    }
    res.json({ message: "Security zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting security zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dangerzones", async (req, res) => {
  try {
    const dangerZones = await DangerZone.find();
    res.json(dangerZones);
  } catch (error) {
    console.error("Error fetching danger zones:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// For Danger Zones
router.post("/dangerzones/add", async (req, res) => {
  try {
    const { markers } = req.body;  // Each marker has coordinates and a description
    if (markers.length !== 10) {
      return res.status(400).json({ error: "Exactly 10 markers are required." });
    }
    const createdZones = await DangerZone.create({ markers });
    res.status(201).json({ success: true, message: "Dangerous zones added successfully", data: createdZones });
  } catch (error) {
    console.error("Error adding dangerous zones:", error);
    res.status(500).json({ success: false, error: "Failed to add dangerous zones" });
  }
});

router.get("/dangerzones/:id", async (req, res) => {
  try {
    const dangerZone = await DangerZone.findById(req.params.id);
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
    console.error("Error updating danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/dangerzones/:id", async (req, res) => {
  try {
    const deletedDangerZone = await DangerZone.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDangerZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }
    res.json({ message: "Danger zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting danger zone:", error);
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
