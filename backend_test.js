const axios = require('axios');

class DriverManagementTester {
    constructor(baseUrl = "https://driverhub-28.preview.emergentagent.com") {
        this.baseUrl = baseUrl;
        this.sessionCookie = null;
        this.testsRun = 0;
        this.testsPassed = 0;
    }

    async runTest(name, testFunction) {
        this.testsRun++;
        console.log(`\n🔍 Testing ${name}...`);
        
        try {
            const result = await testFunction();
            if (result) {
                this.testsPassed++;
                console.log(`✅ Passed - ${name}`);
            } else {
                console.log(`❌ Failed - ${name}`);
            }
            return result;
        } catch (error) {
            console.log(`❌ Failed - ${name}: ${error.message}`);
            return false;
        }
    }

    async makeRequest(method, endpoint, data = null, expectStatus = 200) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            maxRedirects: 0,
            validateStatus: () => true // Don't throw on any status code
        };

        if (this.sessionCookie) {
            config.headers['Cookie'] = this.sessionCookie;
        }

        if (data) {
            if (method === 'GET') {
                config.params = data;
            } else {
                // Convert data to URL-encoded format
                const params = new URLSearchParams();
                Object.keys(data).forEach(key => {
                    params.append(key, data[key]);
                });
                config.data = params.toString();
            }
        }

        const response = await axios(config);
        
        // Extract session cookie from response
        if (response.headers['set-cookie']) {
            const sessionCookie = response.headers['set-cookie'].find(cookie => 
                cookie.startsWith('connect.sid=')
            );
            if (sessionCookie) {
                this.sessionCookie = sessionCookie.split(';')[0];
            }
        }

        return {
            status: response.status,
            data: response.data,
            headers: response.headers
        };
    }

    async testHealthCheck() {
        return await this.runTest("Health Check", async () => {
            const response = await this.makeRequest('GET', '/api/health');
            return response.status === 200 && response.data.status === 'ok';
        });
    }

    async testLoginPage() {
        return await this.runTest("Login Page Load", async () => {
            const response = await this.makeRequest('GET', '/auth/login');
            return response.status === 200 && response.data.includes('login');
        });
    }

    async testLogin() {
        return await this.runTest("Admin Login", async () => {
            const response = await this.makeRequest('POST', '/auth/login', {
                username: 'admin',
                password: 'Admin123!'
            });
            // Should redirect to dashboard (302) or return dashboard (200)
            return response.status === 302 || response.status === 200;
        });
    }

    async testDashboardAccess() {
        return await this.runTest("Dashboard Access", async () => {
            const response = await this.makeRequest('GET', '/dashboard');
            return response.status === 200 && response.data.includes('Dashboard');
        });
    }

    async testDriversList() {
        return await this.runTest("Drivers List API", async () => {
            const response = await this.makeRequest('GET', '/dashboard');
            // Check if dashboard contains driver data
            return response.status === 200 && 
                   (response.data.includes('Fahrerliste') || response.data.includes('drivers'));
        });
    }

    async testAddDriver() {
        return await this.runTest("Add Driver", async () => {
            const testDriver = {
                vorname: 'Test',
                nachname: 'Driver',
                email: 'test@example.com',
                phone: '123456789',
                status: 'neu',
                fahrzeugtyp: 'PKW',
                kennzeichen: 'TEST-123',
                sticker: 'true',
                app: 'true'
            };
            
            const response = await this.makeRequest('POST', '/drivers/add', testDriver);
            // Should redirect to dashboard (302)
            return response.status === 302;
        });
    }

    async testGetDriver() {
        return await this.runTest("Get Driver for Edit", async () => {
            // Try to get driver with ID 1 (should exist from seed data)
            const response = await this.makeRequest('GET', '/drivers/get/1');
            return response.status === 200 && typeof response.data === 'object';
        });
    }

    async testUpdateDriverStatus() {
        return await this.runTest("Update Driver Status", async () => {
            const response = await this.makeRequest('POST', '/drivers/status/1', {
                status: 'aktiv'
            });
            // Should redirect to dashboard (302)
            return response.status === 302;
        });
    }

    async testCSVExport() {
        return await this.runTest("CSV Export", async () => {
            const response = await this.makeRequest('GET', '/dashboard/export');
            return response.status === 200 && 
                   response.headers['content-type'] && 
                   response.headers['content-type'].includes('csv');
        });
    }

    async testStickerPage() {
        return await this.runTest("Sticker Page Access", async () => {
            const response = await this.makeRequest('GET', '/sticker');
            return response.status === 200 && response.data.includes('Sticker');
        });
    }

    async testEmpfehlungenPage() {
        return await this.runTest("Empfehlungen Page Access", async () => {
            const response = await this.makeRequest('GET', '/empfehlungen');
            return response.status === 200 && response.data.includes('Empfehlung');
        });
    }

    async testLogout() {
        return await this.runTest("Logout", async () => {
            const response = await this.makeRequest('GET', '/auth/logout');
            // Should redirect to login (302)
            return response.status === 302;
        });
    }

    async runAllTests() {
        console.log('🚀 Starting Driver Management System Backend Tests...\n');
        
        // Basic connectivity tests
        await this.testHealthCheck();
        await this.testLoginPage();
        
        // Authentication tests
        await this.testLogin();
        
        // Dashboard and driver management tests
        await this.testDashboardAccess();
        await this.testDriversList();
        await this.testGetDriver();
        await this.testAddDriver();
        await this.testUpdateDriverStatus();
        await this.testCSVExport();
        
        // Additional pages tests
        await this.testStickerPage();
        await this.testEmpfehlungenPage();
        
        // Logout test
        await this.testLogout();
        
        // Print results
        console.log(`\n📊 Backend Tests Summary:`);
        console.log(`Tests passed: ${this.testsPassed}/${this.testsRun}`);
        console.log(`Success rate: ${Math.round((this.testsPassed / this.testsRun) * 100)}%`);
        
        return {
            total: this.testsRun,
            passed: this.testsPassed,
            failed: this.testsRun - this.testsPassed,
            successRate: Math.round((this.testsPassed / this.testsRun) * 100)
        };
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DriverManagementTester();
    tester.runAllTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = DriverManagementTester;