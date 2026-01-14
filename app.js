// Configuration
const API_URL = 'http://localhost:8000';

// Global State
let currentUser = null;
let beforeImage = null;
let afterImage = null;
let currentScanId = null;
let currentEditingItem = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set today's date as default
    document.getElementById('scanDate').valueAsDate = new Date();
    document.getElementById('staffDateFilter').valueAsDate = new Date();
    
    // Auto-detect meal type based on time
    setMealTypeByTime();
    
    // Event Listeners
    setupEventListeners();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        navigateToApp();
    }
}

function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('staffLogoutBtn').addEventListener('click', handleLogout);
    
    // Image uploads
    document.getElementById('beforeCard').addEventListener('click', () => {
        document.getElementById('beforeImageInput').click();
    });
    document.getElementById('afterCard').addEventListener('click', () => {
        document.getElementById('afterImageInput').click();
    });
    document.getElementById('beforeImageInput').addEventListener('change', (e) => {
        handleImageUpload(e, 'before');
    });
    document.getElementById('afterImageInput').addEventListener('change', (e) => {
        handleImageUpload(e, 'after');
    });
    
    // Scan button
    document.getElementById('scanBtn').addEventListener('click', handleScan);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Staff filters
    document.getElementById('refreshDataBtn')?.addEventListener('click', loadStaffData);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
}

// Login/Logout
function handleLogin(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const schoolId = document.getElementById('schoolId').value;
    const userType = document.getElementById('userType').value;
    
    currentUser = { userId, schoolId, userType };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    navigateToApp();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Reset state
    beforeImage = null;
    afterImage = null;
    
    // Show login page
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
}

function navigateToApp() {
    // Hide login
    document.getElementById('loginPage').classList.remove('active');
    
    if (currentUser.userType === 'staff') {
        // Show staff view
        document.getElementById('staffApp').classList.add('active');
        document.getElementById('staffNavUserName').textContent = `Staff: ${currentUser.userId}`;
        document.getElementById('schoolName').textContent = currentUser.schoolId;
        loadStaffData();
    } else {
        // Show student view
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('navUserName').textContent = `${currentUser.userId}`;
        loadStudentHistory();
    }
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data if switching to history
    if (tabName === 'history') {
        loadStudentHistory();
    }
}

// Image upload handling
function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imgData = e.target.result;
        const card = type === 'before' ? document.getElementById('beforeCard') : document.getElementById('afterCard');
        
        card.innerHTML = `
            <img src="${imgData}" alt="${type} image">
            <p><strong>${type === 'before' ? 'Before' : 'After'} Eating</strong></p>
            <p style="font-size: 0.9em; color: #7f8c8d;">Click to change</p>
        `;
        card.classList.add('has-image');
        
        if (type === 'before') {
            beforeImage = file;
        } else {
            afterImage = file;
        }
        
        // Enable scan button if both images uploaded
        if (beforeImage && afterImage) {
            document.getElementById('scanBtn').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// Scan handling
async function handleScan() {
    if (!beforeImage || !afterImage) {
        alert('Please upload both before and after images');
        return;
    }
    
    // Show loading
    document.getElementById('scanBtn').style.display = 'none';
    document.getElementById('scanLoading').style.display = 'block';
    document.getElementById('scanResults').style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('before_image', beforeImage);
        formData.append('after_image', afterImage);
        formData.append('student_id', currentUser.userId);
        formData.append('school_id', currentUser.schoolId);
        
        const response = await fetch(`${API_URL}/api/scan`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Scan failed');
        }
        
        const data = await response.json();
        currentScanId = data.scan_id;
        
        // Store meal metadata
        const mealType = document.getElementById('mealType').value;
        const scanDate = document.getElementById('scanDate').value;
        
        displayResults(data, mealType, scanDate);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to analyze images. Please try again.');
    } finally {
        document.getElementById('scanBtn').style.display = 'block';
        document.getElementById('scanLoading').style.display = 'none';
    }
}

// Display results
function displayResults(data, mealType, scanDate) {
    // Update summary
    document.getElementById('totalWaste').textContent = `${data.avg_waste_percentage}%`;
    document.getElementById('pointsEarned').textContent = data.points;
    
    // Display food items
    const foodItemsList = document.getElementById('foodItemsList');
    foodItemsList.innerHTML = '';
    
    data.food_items.forEach((item, index) => {
        const wasteClass = item.waste_percentage <= 20 ? 'waste-low' : 
                          item.waste_percentage <= 50 ? 'waste-medium' : 'waste-high';
        
        const itemEl = document.createElement('div');
        itemEl.className = 'food-item';
        itemEl.innerHTML = `
            <div class="food-item-info">
                <div class="food-item-header">
                    <span class="food-name">${item.name}</span>
                    <span class="waste-badge ${wasteClass}">${item.waste_percentage}% wasted</span>
                </div>
                <div class="food-details">
                    <div><strong>Initial:</strong> ${item.initial_portion}</div>
                    <div><strong>Remaining:</strong> ${item.remaining_portion}</div>
                    <div><strong>Weight:</strong> ${item.estimated_weight_oz} oz</div>
                </div>
            </div>
            <div class="food-item-actions">
                <button class="btn-icon" onclick="editFoodItem(${index})">✏️ Edit</button>
            </div>
        `;
        foodItemsList.appendChild(itemEl);
    });
    
    // Display impact
    const impactGrid = document.getElementById('impactGrid');
    impactGrid.innerHTML = `
        <div class="impact-card">
            <span class="impact-value">${data.impact.weight_oz}</span>
            <span class="impact-label">oz Wasted</span>
        </div>
        <div class="impact-card">
            <span class="impact-value">$${data.impact.cost_usd}</span>
            <span class="impact-label">Cost</span>
        </div>
        <div class="impact-card">
            <span class="impact-value">${data.impact.co2_kg}</span>
            <span class="impact-label">CO2 (kg)</span>
        </div>
        <div class="impact-card">
            <span class="impact-value">${data.impact.water_gallons}</span>
            <span class="impact-label">Water (gal)</span>
        </div>
    `;
    
    // Display tips
    const tipsSection = document.getElementById('tipsSection');
    tipsSection.innerHTML = `
        <h4>💡 Tips for Next Time</h4>
        <ul>
            ${data.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
    `;
    
    // Show results
    document.getElementById('scanResults').style.display = 'block';
    document.getElementById('scanResults').scrollIntoView({ behavior: 'smooth' });
}

// Edit food item
function editFoodItem(index) {
    currentEditingItem = index;
    
    // Get current scan data from results
    const foodItems = document.querySelectorAll('.food-item');
    const item = foodItems[index];
    const name = item.querySelector('.food-name').textContent;
    const percentage = parseFloat(item.querySelector('.waste-badge').textContent);
    
    document.getElementById('editFoodName').value = name;
    document.getElementById('editWastePercentage').value = percentage;
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditingItem = null;
}

function saveEdit() {
    if (currentEditingItem === null) return;
    
    const newName = document.getElementById('editFoodName').value;
    const newPercentage = parseFloat(document.getElementById('editWastePercentage').value);
    
    // Update the display
    const foodItems = document.querySelectorAll('.food-item');
    const item = foodItems[currentEditingItem];
    
    item.querySelector('.food-name').textContent = newName;
    
    const wasteBadge = item.querySelector('.waste-badge');
    wasteBadge.textContent = `${newPercentage}% wasted`;
    
    // Update waste class
    wasteBadge.className = 'waste-badge ' + 
        (newPercentage <= 20 ? 'waste-low' : 
         newPercentage <= 50 ? 'waste-medium' : 'waste-high');
    
    closeEditModal();
    
    // Note: In a real app, you would also update this in the backend
    alert('Changes saved! (Note: This is a local update only)');
}

// Load student history
async function loadStudentHistory() {
    try {
        const response = await fetch(
            `${API_URL}/api/student-stats?student_id=${currentUser.userId}&days=30`
        );
        
        if (!response.ok) throw new Error('Failed to load history');
        
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalScans').textContent = data.total_scans || 0;
        document.getElementById('avgWasteHistory').textContent = `${data.avg_waste_pct || 0}%`;
        document.getElementById('totalPoints').textContent = data.total_points || 0;
        
        // Display foods to avoid (most wasted)
        displayTopFoods(data.foods_to_avoid || [], 'mostWastedList', true);
        
        // For least wasted, we'll simulate data (in real app, backend should provide this)
        displayTopFoods([], 'leastWastedList', false);
        
        // Load past scans
        await loadPastScans();
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayTopFoods(foods, containerId, isMostWasted) {
    const container = document.getElementById(containerId);
    
    if (!foods || foods.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No data available yet</p>';
        return;
    }
    
    container.innerHTML = foods.map(food => {
        const percentage = food.avg_waste_pct;
        const barClass = percentage > 50 ? 'bar-high' : percentage > 25 ? 'bar-medium' : 'bar-low';
        
        return `
            <div class="food-bar-item">
                <div class="food-bar-header">
                    <span class="food-bar-name">${food.food}</span>
                    <span class="food-bar-percentage">${percentage}%</span>
                </div>
                <div class="food-bar-container">
                    <div class="food-bar-fill ${barClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Load past scans
async function loadPastScans() {
    try {
        // Get daily report for recent days
        const pastScansList = document.getElementById('pastScansList');
        pastScansList.innerHTML = '<p style="text-align: center; padding: 40px;">Loading past scans...</p>';
        
        // In a real app, you'd have an endpoint that returns user's scan history
        // For now, we'll show a message
        pastScansList.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <p style="color: #7f8c8d; font-size: 1.1em;">Your scan history will appear here</p>
                <p style="color: #7f8c8d; margin-top: 10px;">Complete your first scan to get started!</p>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading past scans:', error);
    }
}

// Staff functions
async function loadStaffData() {
    const date = document.getElementById('staffDateFilter').value;
    
    try {
        // Load daily report
        const dailyResponse = await fetch(
            `${API_URL}/api/daily-report?school_id=${currentUser.schoolId}&date=${date}`
        );
        
        if (!dailyResponse.ok) throw new Error('Failed to load daily data');
        
        const dailyData = await dailyResponse.json();
        
        // Update daily stats
        document.getElementById('dailyScans').textContent = dailyData.total_scans || 0;
        document.getElementById('dailyAvgWaste').textContent = `${dailyData.avg_waste_pct || 0}%`;
        document.getElementById('dailyWeightLbs').textContent = 
            `${dailyData.totals?.weight_lbs || 0} lbs`;
        document.getElementById('dailyCost').textContent = 
            `$${dailyData.totals?.cost_usd || 0}`;
        
        // Display food waste by item
        displaySchoolFoodWaste(dailyData.by_food || []);
        
        // Load insights
        await loadStaffInsights();
        
    } catch (error) {
        console.error('Error loading staff data:', error);
        alert('Failed to load school data. Make sure the server is running.');
    }
}

function displaySchoolFoodWaste(foods) {
    const container = document.getElementById('schoolFoodWasteList');
    
    if (!foods || foods.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No waste data for this date</p>';
        return;
    }
    
    container.innerHTML = foods.map(food => {
        const percentage = food.avg_waste_pct;
        const barClass = percentage > 50 ? 'bar-high' : percentage > 30 ? 'bar-medium' : 'bar-low';
        
        return `
            <div class="food-waste-item">
                <div class="food-waste-header">
                    <span class="food-waste-name">${food.food}</span>
                    <div class="food-waste-stats">
                        <span>${food.appearances} servings</span>
                        <span class="food-waste-percentage">${percentage}%</span>
                    </div>
                </div>
                <div class="food-waste-bar">
                    <div class="food-waste-fill ${barClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="food-waste-recommendation">${food.recommendation}</div>
            </div>
        `;
    }).join('');
}

async function loadStaffInsights() {
    try {
        const response = await fetch(
            `${API_URL}/api/insights?school_id=${currentUser.schoolId}&days=7`
        );
        
        if (!response.ok) throw new Error('Failed to load insights');
        
        const data = await response.json();
        displayInsights(data.insights || []);
        
    } catch (error) {
        console.error('Error loading insights:', error);
    }
}

function displayInsights(insights) {
    const container = document.getElementById('staffInsightsList');
    
    if (!insights || insights.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No insights available yet</p>';
        return;
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-card ${insight.type}">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-description">${insight.description}</div>
        </div>
    `).join('');
}

// Helper functions
function setMealTypeByTime() {
    const hour = new Date().getHours();
    const mealTypeSelect = document.getElementById('mealType');
    
    if (hour >= 6 && hour < 11) {
        mealTypeSelect.value = 'breakfast';
    } else if (hour >= 11 && hour < 16) {
        mealTypeSelect.value = 'lunch';
    } else if (hour >= 16 && hour < 22) {
        mealTypeSelect.value = 'dinner';
    } else {
        mealTypeSelect.value = 'other';
    }
}
