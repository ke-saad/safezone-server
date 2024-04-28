const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../model/User');
const Notification = require('../model/Notification');
const Report = require('../model/Report');
const Role = require('../model/Role');
const Safety = require('../model/Safety');
const SecurityZone = require('../model/SecurityZone');
const Settings = require('../model/Settings');
const Status = require('../model/Status');
const ActivityLog = require('../model/ActivityLog');
const Alert = require('../model/Alert');
const DangerPoint = require('../model/DangerPoint');

router.post('/register', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Try another username.' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      username: req.body.username,
      password: hashedPassword,
      isAdmin: req.body.isAdmin || false,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.post('/login', async (req, res) => {
  try {

    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }


    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }


    const token = jwt.sign({ userId: user._id }, 'mySecretKey123');


    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/users', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/statuses', async (req, res) => {
  try {
    const statuses = await Status.find();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/statuses', async (req, res) => {
  try {
    const newStatus = await Status.create(req.body);
    res.status(201).json(newStatus);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/statuses/:id', async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/statuses/:id', async (req, res) => {
  try {
    const updatedStatus = await Status.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStatus) {
      return res.status(404).json({ message: 'Status not found' });
    }
    res.json(updatedStatus);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/statuses/:id', async (req, res) => {
  try {
    const deletedStatus = await Status.findByIdAndDelete(req.params.id);
    if (!deletedStatus) {
      return res.status(404).json({ message: 'Status not found' });
    }
    res.json({ message: 'Status deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/settings', async (req, res) => {
  try {
    const newSetting = await Settings.create(req.body);
    res.status(201).json(newSetting);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/settings/:id', async (req, res) => {
  try {
    const setting = await Settings.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/settings/:id', async (req, res) => {
  try {
    const updatedSetting = await Settings.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSetting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(updatedSetting);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/settings/:id', async (req, res) => {
  try {
    const deletedSetting = await Settings.findByIdAndDelete(req.params.id);
    if (!deletedSetting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/securityzones', async (req, res) => {
  try {
    const securityZones = await SecurityZone.find();
    res.json(securityZones);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/securityzones', async (req, res) => {
  try {
    const newSecurityZone = await SecurityZone.create(req.body);
    res.status(201).json(newSecurityZone);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/securityzones/:id', async (req, res) => {
  try {
    const securityZone = await SecurityZone.findById(req.params.id);
    if (!securityZone) {
      return res.status(404).json({ message: 'Security zone not found' });
    }
    res.json(securityZone);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/securityzones/:id', async (req, res) => {
  try {
    const updatedSecurityZone = await SecurityZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSecurityZone) {
      return res.status(404).json({ message: 'Security zone not found' });
    }
    res.json(updatedSecurityZone);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/securityzones/:id', async (req, res) => {
  try {
    const deletedSecurityZone = await SecurityZone.findByIdAndDelete(req.params.id);
    if (!deletedSecurityZone) {
      return res.status(404).json({ message: 'Security zone not found' });
    }
    res.json({ message: 'Security zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/safety', async (req, res) => {
  try {
    const safetyEntries = await Safety.find();
    res.json(safetyEntries);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/safety', async (req, res) => {
  try {
    const newSafetyEntry = await Safety.create(req.body);
    res.status(201).json(newSafetyEntry);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/safety/:id', async (req, res) => {
  try {
    const safetyEntry = await Safety.findById(req.params.id);
    if (!safetyEntry) {
      return res.status(404).json({ message: 'Safety entry not found' });
    }
    res.json(safetyEntry);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/safety/:id', async (req, res) => {
  try {
    const updatedSafetyEntry = await Safety.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSafetyEntry) {
      return res.status(404).json({ message: 'Safety entry not found' });
    }
    res.json(updatedSafetyEntry);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/safety/:id', async (req, res) => {
  try {
    const deletedSafetyEntry = await Safety.findByIdAndDelete(req.params.id);
    if (!deletedSafetyEntry) {
      return res.status(404).json({ message: 'Safety entry not found' });
    }
    res.json({ message: 'Safety entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/roles', async (req, res) => {
  try {
    const newRole = await Role.create(req.body);
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/roles/:id', async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/roles/:id', async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/reports', async (req, res) => {
  try {
    const newReport = await Report.create(req.body);
    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/reports/:id', async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/reports/:id', async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/activityLogs', async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find();
    res.json(activityLogs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/activityLogs', async (req, res) => {
  try {
    const newActivityLog = await ActivityLog.create(req.body);
    res.status(201).json(newActivityLog);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/activityLogs/:id', async (req, res) => {
  try {
    const activityLog = await ActivityLog.findById(req.params.id);
    if (!activityLog) {
      return res.status(404).json({ message: 'Activity log not found' });
    }
    res.json(activityLog);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/activityLogs/:id', async (req, res) => {
  try {
    const updatedActivityLog = await ActivityLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedActivityLog) {
      return res.status(404).json({ message: 'Activity log not found' });
    }
    res.json(updatedActivityLog);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/activityLogs/:id', async (req, res) => {
  try {
    const deletedActivityLog = await ActivityLog.findByIdAndDelete(req.params.id);
    if (!deletedActivityLog) {
      return res.status(404).json({ message: 'Activity log not found' });
    }
    res.json({ message: 'Activity log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/alerts', async (req, res) => {
  try {
    const newAlert = await Alert.create(req.body);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/alerts/:id', async (req, res) => {
  try {
    const updatedAlert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(updatedAlert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/alerts/:id', async (req, res) => {
  try {
    const deletedAlert = await Alert.findByIdAndDelete(req.params.id);
    if (!deletedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/notifications', async (req, res) => {
  try {
    const newNotification = await Notification.create(req.body);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/notifications/:id', async (req, res) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(updatedNotification);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/notifications/:id', async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/dangerpoints', async (req, res) => {
  try {
    
    const { latitude, longitude } = req.body;
    
    const newDangerPoint = await DangerPoint.create({ latitude, longitude });
    
    res.status(201).json(newDangerPoint);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
