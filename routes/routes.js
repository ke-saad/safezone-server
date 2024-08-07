require('dotenv').config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const User = require("../model/User");
const ActivityLog = require("../model/ActivityLog");
const Alert = require("../model/Alert");
const DangerZone = require("../model/DangerZone");
const SafeZone = require("../model/SafeZone");
const DangerMarker = require("../model/DangerMarker");
const SafetyMarker = require("../model/SafetyMarker");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    console.log("No token provided.");
    return res.status(403).json({ message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Failed to authenticate token.", err);
      return res.status(403).json({ message: "Failed to authenticate token." });
    }

    req.user = decoded;
    console.log("Token verified:", decoded);
    next();
  });
};


router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route" });
});


router.post("/register", async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Try another username." });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      username: req.body.username,
      password: hashedPassword,
      isAdmin: req.body.isAdmin || false,
    });


    await ActivityLog.create({
      action: "User registered",
      username: req.body.username
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

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id, role: user.isAdmin ? "admin" : "user" }, process.env.JWT_SECRET);

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


router.get("/user/role", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ role: user.isAdmin ? "admin" : "user", username: user.username });
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
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (password) {

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }


      if (userData.newPassword) {
        userData.password = await bcrypt.hash(userData.newPassword, 10);
      }
    }


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

    const createdZone = await DangerZone.create({
      markers: markers.map(marker => ({
        coordinates: marker.coordinates,
        description: marker.description,
        place_name: marker.place_name,
        context: marker.context,
        timestamp: marker.timestamp,
        region_id: marker.context.find(ctx => ctx.wikidata === 'Q215467')?.id || "",
        country_name: marker.context.find(ctx => ctx.wikidata === 'Q262')?.text || "",
        short_code: marker.context.find(ctx => ctx.wikidata === 'Q262')?.short_code || "",
      })),
    });

    res.status(201).json({
      success: true,
      message: "Danger zone added successfully",
      data: { zone: createdZone },
    });
  } catch (error) {
    console.error("Error adding danger zone:", error);
    res.status(500).json({ success: false, error: "Failed to add danger zone" });
  }
});

router.get('/dangerzones/:id', async (req, res) => {
  try {
    const dangerZone = await DangerZone.findById(req.params.id).populate("markers");
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
      const updatedMarkers = markers.map(marker => ({
        coordinates: marker.coordinates,
        description: marker.description,
        place_name: marker.place_name,
        context: marker.context,
        timestamp: marker.timestamp,
        region_id: marker.context.find(ctx => ctx.wikidata === 'Q215467')?.id || "",
        country_name: marker.context.find(ctx => ctx.wikidata === 'Q262')?.text || "",
        short_code: marker.context.find(ctx => ctx.wikidata === 'Q262')?.short_code || "",
      }));

      const updatedDangerZone = await DangerZone.findByIdAndUpdate(
        req.params.id,
        { markers: updatedMarkers },
        { new: true }
      );

      if (!updatedDangerZone) {
        return res.status(404).json({ message: "Danger zone not found" });
      }

      res.json(updatedDangerZone);
    } else {
      res.status(400).json({ message: "Markers array should contain exactly 10 markers." });
    }
  } catch (error) {
    console.error("Error updating danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/dangerzones/:id", async (req, res) => {
  try {
    const deletedZone = await DangerZone.findByIdAndDelete(req.params.id);
    if (!deletedZone) {
      return res.status(404).json({ message: "Danger zone not found" });
    }

    await DangerMarker.deleteMany({ zone: deletedZone._id });

    return res.json({
      success: true,
      message: "Danger zone and associated markers deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting danger zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/pending-dangerzone/:alertId', verifyToken, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId).populate('zone');
    if (!alert || !alert.zone) {
      return res.status(404).json({ message: 'Pending danger zone not found' });
    }
    res.json(alert.zone);
  } catch (error) {
    console.error('Error fetching pending danger zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/dangerzones/approve/:id', verifyToken, async (req, res) => {
  try {
    const updatedZone = await DangerZone.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!updatedZone) {
      return res.status(404).json({ message: 'Danger zone not found' });
    }
    res.json(updatedZone);
  } catch (error) {
    console.error('Error approving danger zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/dangerzones/disapprove/:id', verifyToken, async (req, res) => {
  try {
    const updatedZone = await DangerZone.findByIdAndUpdate(
      req.params.id,
      { status: 'disapproved' },
      { new: true }
    );
    if (!updatedZone) {
      return res.status(404).json({ message: 'Danger zone not found' });
    }
    res.json(updatedZone);
  } catch (error) {
    console.error('Error disapproving danger zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get("/dangermarkers", async (req, res) => {
  try {
    const dangerMarkers = await DangerMarker.find();
    res.json(dangerMarkers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/dangermarkers/:id', async (req, res) => {
  try {
    const dangerMarker = await DangerMarker.findById(req.params.id);
    if (!dangerMarker) {
      return res.status(404).json({ message: 'Danger marker not found' });
    }
    res.json(dangerMarker);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post("/dangermarkers/add", async (req, res) => {
  try {
    const { coordinates, description, context, timestamp } = req.body;


    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: "Invalid coordinates provided." });
    }


    const newMarker = await DangerMarker.create({
      coordinates,
      description,
      context,
      timestamp,
      region_id: context.find(ctx => ctx.id.includes("region"))?.id || "",
      country_name: context.find(ctx => ctx.id.includes("country"))?.text || "",
      short_code: context.find(ctx => ctx.id.includes("country"))?.short_code || "",
    });

    res.status(201).json({
      success: true,
      message: "Danger marker added successfully",
      data: newMarker,
    });
  } catch (error) {
    console.error("Error adding danger marker:", error);
    res.status(500).json({ success: false, error: "Failed to add danger marker" });
  }
});


router.put("/dangermarkers/:id", async (req, res) => {
  try {
    const { coordinates, description, place_name, context, timestamp } = req.body;

    const updatedMarker = await DangerMarker.findByIdAndUpdate(
      req.params.id,
      {
        coordinates,
        description,
        place_name,
        context,
        timestamp,
        region_id: context.find(ctx => ctx.id.includes("region"))?.id || "",
        country_name: context.find(ctx => ctx.id.includes("country"))?.text || "",
        short_code: context.find(ctx => ctx.id.includes("country"))?.short_code || "",
      },
      { new: true }
    );

    if (!updatedMarker) {
      return res.status(404).json({ message: "Danger marker not found" });
    }

    res.json(updatedMarker);
  } catch (error) {
    console.error("Error updating danger marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/dangermarkers/:id", async (req, res) => {
  try {
    const deletedMarker = await DangerMarker.findByIdAndDelete(req.params.id);
    if (!deletedMarker) {
      return res.status(404).json({ message: "Danger marker not found" });
    }
    res.json({ message: "Danger marker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});


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
      return res.status(400).json({ error: "Exactly 10 markers are required." });
    }

    const createdZone = await SafeZone.create({
      markers: markers.map(marker => ({
        coordinates: marker.coordinates,
        place_name: marker.place_name,
        context: marker.context,
        timestamp: marker.timestamp,
        region_id: marker.context.find(ctx => ctx.wikidata === 'Q215467')?.id || "",
        country_name: marker.context.find(ctx => ctx.wikidata === 'Q262')?.text || "",
        short_code: marker.context.find(ctx => ctx.wikidata === 'Q262')?.short_code || "",
      })),
    });

    res.status(201).json({
      success: true,
      message: "Safe zone added successfully",
      data: { zone: createdZone },
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
      const updatedMarkers = markers.map(marker => ({
        coordinates: marker.coordinates,
        place_name: marker.place_name,
        context: marker.context,
        timestamp: marker.timestamp,
        region_id: marker.context.find(ctx => ctx.wikidata === 'Q215467')?.id || "",
        country_name: marker.context.find(ctx => ctx.wikidata === 'Q262')?.text || "",
        short_code: marker.context.find(ctx => ctx.wikidata === 'Q262')?.short_code || "",
      }));

      const updatedSafeZone = await SafeZone.findByIdAndUpdate(
        req.params.id,
        { markers: updatedMarkers },
        { new: true }
      );

      if (!updatedSafeZone) {
        return res.status(404).json({ message: "Safe zone not found" });
      }

      res.json(updatedSafeZone);
    } else {
      res.status(400).json({ message: "Markers array should contain exactly 10 markers." });
    }
  } catch (error) {
    console.error("Error updating safe zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/safezones/:id", async (req, res) => {
  try {
    const deletedZone = await SafeZone.findByIdAndDelete(req.params.id);
    if (!deletedZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }

    await SafetyMarker.deleteMany({ zone: deletedZone._id });

    return res.json({
      success: true,
      message: "Safe zone and associated markers deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting safe zone:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/pending-safezone/:alertId', verifyToken, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId).populate('zone');
    if (!alert || !alert.zone) {
      return res.status(404).json({ message: 'Pending safe zone not found' });
    }
    res.json(alert.zone);
  } catch (error) {
    console.error('Error fetching pending safe zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/safezones/approve/:id', verifyToken, async (req, res) => {
  try {
    const updatedZone = await SafeZone.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!updatedZone) {
      return res.status(404).json({ message: 'Safe zone not found' });
    }
    res.json(updatedZone);
  } catch (error) {
    console.error('Error approving safe zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/safezones/disapprove/:id', verifyToken, async (req, res) => {
  try {
    const updatedZone = await SafeZone.findByIdAndUpdate(
      req.params.id,
      { status: 'disapproved' },
      { new: true }
    );
    if (!updatedZone) {
      return res.status(404).json({ message: 'Safe zone not found' });
    }
    res.json(updatedZone);
  } catch (error) {
    console.error('Error disapproving safe zone:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get("/safetymarkers", async (req, res) => {
  try {
    const safetyMarkers = await SafetyMarker.find();
    res.json(safetyMarkers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/safetymarkers/:id', async (req, res) => {
  try {
    const safetyMarker = await SafetyMarker.findById(req.params.id);
    if (!safetyMarker) {
      return res.status(404).json({ message: 'Safety marker not found' });
    }
    res.json(safetyMarker);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/safetymarkers/add", async (req, res) => {
  try {
    const { coordinates, place_name, context, timestamp } = req.body;

    const newMarker = await SafetyMarker.create({
      coordinates,
      place_name,
      context,
      timestamp,
      region_id: context.find(ctx => ctx.id.includes("region"))?.id || "",
      country_name: context.find(ctx => ctx.id.includes("country"))?.text || "",
      short_code: context.find(ctx => ctx.id.includes("country"))?.short_code || "",
    });

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
    const { coordinates, place_name, context, timestamp } = req.body;

    const updatedMarker = await SafetyMarker.findByIdAndUpdate(
      req.params.id,
      {
        coordinates,
        place_name,
        context,
        timestamp,
        region_id: context.find(ctx => ctx.id.includes("region"))?.id || "",
        country_name: context.find(ctx => ctx.id.includes("country"))?.text || "",
        short_code: context.find(ctx => ctx.id.includes("country"))?.short_code || "",
      },
      { new: true }
    );

    if (!updatedMarker) {
      return res.status(404).json({ message: "Safety marker not found" });
    }

    res.json(updatedMarker);
  } catch (error) {
    console.error("Error updating safety marker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/safetymarkers/:id", async (req, res) => {
  try {
    const deletedMarker = await SafetyMarker.findByIdAndDelete(req.params.id);
    if (!deletedMarker) {
      return res.status(404).json({ message: "Safety marker not found" });
    }
    res.json({ message: "Safety marker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/activityLogs", async (req, res) => {
  try {
    const { username } = req.query;
    const query = username ? { username } : {};
    const activityLogs = await ActivityLog.find(query);
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

router.get("/activityLogs/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const logs = await ActivityLog.find({ username }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/activityLogs/:id", async (req, res) => {
  try {
    const updatedActivityLog = await ActivityLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const deletedActivityLog = await ActivityLog.findByIdAndDelete(req.params.id);
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
    const updatedAlert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

router.post('/alerts/danger', async (req, res) => {
  try {
    const { coordinates } = req.body;
    const userId = req.userId;


    const newAlert = new Alert({
      type: "danger",
      message: `User is in a danger zone at coordinates: ${coordinates}`,
      userId,
      status: "pending",
      zoneType: "DangerZone",
      zoneData: { coordinates }
    });


    await newAlert.save();


    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating danger alert:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/markers/:id', async (req, res) => {
  try {
    let marker = await DangerMarker.findById(req.params.id).lean();
    if (!marker) {
      marker = await SafetyMarker.findById(req.params.id).lean();
      if (!marker) {
        return res.status(404).json({ message: 'Marker not found' });
      }
    }
    res.json(marker);
  } catch (error) {
    console.error('Error fetching marker details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.get('/mapbox/forward', async (req, res) => {
  try {
    const { q, limit } = req.query;
    const response = await axios.get('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(q) + '.json', {
      params: {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
        limit
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching forward geocode:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/mapbox/reverse-geocode', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    const formattedLongitude = parseFloat(longitude).toFixed(6);
    const formattedLatitude = parseFloat(latitude).toFixed(6);
    if (isNaN(formattedLongitude) || isNaN(formattedLatitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${formattedLongitude},${formattedLatitude}.json`, {
      params: {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching reverse geocode:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post('/calculate-itinerary', async (req, res) => {
  try {
    const { startCoordinates, endCoordinates, profile } = req.body;


    const coordinates = `${startCoordinates[1]},${startCoordinates[0]};${endCoordinates[1]},${endCoordinates[0]}`;
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`;


    const params = {
      access_token: process.env.MAPBOX_ACCESS_TOKEN
    };


    const itineraryResponse = await axios.get(mapboxUrl, { params });

    const itinerary = itineraryResponse.data;

    res.status(200).json({ itinerary });
  } catch (error) {
    console.error('Error calculating itinerary:', error);
    if (error.response && error.response.status === 403) {
      res.status(403).json({ message: 'Forbidden. Check your Mapbox access token.' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

module.exports = router;
