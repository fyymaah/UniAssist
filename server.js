const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(__dirname));
app.use('/models', express.static(path.join(__dirname, 'public', 'models')));

// ============================================
// DATABASE
// ============================================
const DB_FILE = path.join(__dirname, 'users.json');

const getUsers = () => {
    try {
        if (!fs.existsSync(DB_FILE)) return [];
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
};

// ============================================
// FACE RECOGNITION API
// ============================================

// Register new user with role
app.post('/register', (req, res) => {
    try {
        const { name, embedding, role } = req.body;

        if (!name || !embedding) {
            return res.status(400).json({ error: 'Name and face data required' });
        }

        if (!Array.isArray(embedding) || embedding.length === 0) {
            return res.status(400).json({ error: 'Invalid embedding data' });
        }

        const users = getUsers();
        const exists = users.find(u => u.name.toLowerCase() === name.toLowerCase());
        
        if (exists) {
            return res.status(400).json({ error: 'User already registered' });
        }

        const newUser = { 
            name, 
            role: role || 'user',
            embedding,
            registeredAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        
        if (saveUsers(users)) {
            console.log(`✅ New user registered: ${name} (${role || 'user'})`);
            res.json({ success: true, message: 'Face registered successfully!' });
        } else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login with face
app.post('/login', (req, res) => {
    try {
        const { embedding } = req.body;

        if (!embedding || !Array.isArray(embedding)) {
            return res.status(400).json({ error: 'Valid face data required' });
        }

        const users = getUsers();
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'No users registered yet' });
        }
        
        // Recognition threshold
        const threshold = 0.5;

        let bestMatch = null;
        let bestDistance = Infinity;

        users.forEach(user => {
            const storedEmbedding = user.embedding;
            
            if (storedEmbedding.length !== embedding.length) {
                return;
            }

            let sum = 0;
            for (let i = 0; i < storedEmbedding.length; i++) {
                const diff = storedEmbedding[i] - embedding[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = user;
            }
        });

        console.log(`Login attempt - Best match: ${bestMatch?.name}, Distance: ${bestDistance.toFixed(4)}`);

        if (bestMatch && bestDistance < threshold) {
            // Update last login
            bestMatch.lastLogin = new Date().toISOString();
            saveUsers(users);
            
            res.json({ 
                success: true, 
                name: bestMatch.name,
                role: bestMatch.role || 'user',
                confidence: (1 - bestDistance/threshold).toFixed(2)
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Face not recognized',
                confidence: bestMatch ? (1 - bestDistance/threshold).toFixed(2) : 0
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ============================================
// ADMIN USER MANAGEMENT API
// ============================================

// Get all users with roles
app.get('/users', (req, res) => {
    const users = getUsers().map(u => ({ 
        name: u.name, 
        role: u.role || 'user',
        registeredAt: u.registeredAt,
        lastLogin: u.lastLogin
    }));
    res.json(users);
});

// Get single user by name
app.get('/users/:name', (req, res) => {
    const { name } = req.params;
    const users = getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (user) {
        res.json({ 
            name: user.name, 
            role: user.role || 'user',
            registeredAt: user.registeredAt,
            lastLogin: user.lastLogin
        });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Delete user by name (Admin only)
app.delete('/users/:name', (req, res) => {
    try {
        const { name } = req.params;
        let users = getUsers();
        const initialLength = users.length;
        
        // Find the user to delete
        const userToDelete = users.find(u => u.name.toLowerCase() === name.toLowerCase());
        
        if (!userToDelete) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Filter out the user
        users = users.filter(u => u.name.toLowerCase() !== name.toLowerCase());
        
        if (saveUsers(users)) {
            console.log(`✅ Admin deleted user: ${name} (Role: ${userToDelete.role || 'user'})`);
            res.json({ 
                success: true, 
                message: `User '${name}' deleted successfully`,
                deletedUser: {
                    name: userToDelete.name,
                    role: userToDelete.role || 'user',
                    registeredAt: userToDelete.registeredAt
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to delete user' 
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during deletion' 
        });
    }
});

// Delete all users (Admin only - use with caution!)
app.delete('/users', (req, res) => {
    try {
        const { adminPassword } = req.body;
        
        // Simple password protection (in production, use proper authentication)
        if (adminPassword !== 'admin123') {
            return res.status(403).json({ 
                success: false, 
                error: 'Unauthorized. Admin password required.' 
            });
        }

        const users = getUsers();
        const userCount = users.length;
        
        if (userCount === 0) {
            return res.json({ 
                success: true, 
                message: 'No users to delete' 
            });
        }

        // Save empty array
        if (saveUsers([])) {
            console.log(`⚠️ Admin deleted ALL users (${userCount} users removed)`);
            res.json({ 
                success: true, 
                message: `All ${userCount} users deleted successfully`
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to delete users' 
            });
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during bulk deletion' 
        });
    }
});

// Update user role (Admin only)
app.patch('/users/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role. Must be "user" or "admin"' 
            });
        }

        let users = getUsers();
        const userIndex = users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
        
        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Update role
        users[userIndex].role = role;
        
        if (saveUsers(users)) {
            console.log(`✅ Admin updated role: ${name} is now ${role}`);
            res.json({ 
                success: true, 
                message: `User '${name}' role updated to ${role}`,
                user: {
                    name: users[userIndex].name,
                    role: users[userIndex].role,
                    registeredAt: users[userIndex].registeredAt
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to update user role' 
            });
        }
    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during role update' 
        });
    }
});

// ============================================
// UNIASSIST API
// ============================================

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'UniAssist API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

app.get('/api/stats', (req, res) => {
    const users = getUsers();
    const admins = users.filter(u => u.role === 'admin').length;
    
    res.json({
        totalUsers: users.length,
        totalAdmins: admins,
        lastUpdated: new Date().toISOString()
    });
});

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dyslexia', (req, res) => res.sendFile(path.join(__dirname, 'dyslexia.html')));
app.get('/dysgraphia', (req, res) => res.sendFile(path.join(__dirname, 'dysgraphia.html')));
app.get('/color', (req, res) => res.sendFile(path.join(__dirname, 'color.html')));
app.get('/comm', (req, res) => res.sendFile(path.join(__dirname, 'comm.html')));

// 404 Handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎓 UniAssist Server v2.0 Running!');
    console.log('='.repeat(60));
    console.log(`📱 Home:     http://localhost:${PORT}`);
    console.log(`🔐 Login:    http://localhost:${PORT}/login`);
    console.log(`📖 Dyslexia: http://localhost:${PORT}/dyslexia`);
    console.log(`✍️ Dysgraphia: http://localhost:${PORT}/dysgraphia`);
    console.log(`🎨 Color:    http://localhost:${PORT}/color`);
    console.log(`🗣️ Comm Board: http://localhost:${PORT}/comm`);
    console.log('='.repeat(60));
    
    const users = getUsers();
    console.log(`👥 Users registered: ${users.length}`);
    console.log(`👑 Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down UniAssist server...');
    process.exit(0);
});

module.exports = app;
