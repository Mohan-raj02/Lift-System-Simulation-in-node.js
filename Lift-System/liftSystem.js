const readline = require("readline");
const fs = require('fs');

class LiftSystem{
    constructor(totalFloors){     //dynamic floors might be change
        this.totalFloors = totalFloors;
        this.currentFloor = this.loadCurrentFloor();
        this.isDoorOpen =false;
        this.islifMoving = false;
        this.floorToReach = []  //queue or destination queue
    }

    saveCurrentFloor(){
        try {
            fs.writeFileSync('currentFloor.txt', this.currentFloor.toString(), 'utf8');
            console.log(`Current floor ${this.currentFloor} saved successfully.`);
        } catch (err) {
            console.error('Error saving current floor:', err);
        }
    }

    loadCurrentFloor(){
        try{
            const data = fs.readFileSync('currentFloor.txt', 'utf8');
            const floor = parseInt(data, 10);
            if(!isNaN(floor) && floor >= 0 && floor <= this.totalFloors -1)
                console.log(`Lift starting at saved floor ${floor}`);
                return floor;
        } catch(err){
            console.log('No saved floor data found.Starting from default floor 2')
        }
        return 2;
    }

    async requestLift(userfloor){
        console.log(`lift requested at floor ${userfloor}`)

        if(this.currentFloor === userfloor){
            await this.openDoor() //
        }else{
            this.floorToReach.push(userfloor);
            await this.MoveLift(); //
        }
    }

    async MoveLift(){
        while (this.floorToReach >= 0){
            const destination = this.floorToReach.shift();
            console.log(`move the lift to floor ${destination}`);
            this.islifMoving = true;

            //lift direction
            while (this.currentFloor !== destination){
                await this.sleep(1000);                                                  // 1 second delay for movement
                this.currentFloor += this.currentFloor < destination ? 1 : -1
                console.log(`lift at floor ${this.currentFloor}`);
            }
                this.saveCurrentFloor();
                await this.openDoor();
        }
    }

    async openDoor(){
        console.log('Door opens');
        this.isDoorOpen = true;
        for (let i = 10; i > 0; i--) {
            process.stdout.write(`\rDoor will close in ${i} seconds...`); 
            await this.sleep(1000); 
        }
        process.stdout.write(`\rDoor will close in 0 seconds...\n`); 
        this.closeDoor();
        // this.waitForUserSelection();  //
        const userInputReceived = await this.waitForUserSelection(15);
        if(!userInputReceived){
            console.log('\nNo user Selection')
            await this.reopenDoor();
        }
        else if(this.currentFloor == this.floorToReach){
            await this.openDoor()
        }
        else{
            await this.MoveLift();
        }
    }

    async reopenDoor(){
        console.log('Door Opens');
        for (let i = 10; i > 0; i-- ) {
            process.stdout.write(`\rDoor will close in ${i} seconds...`)
            await this.sleep(1000);
        }
        process.stdout.write(`\rDoor will close in 0 seconds...\n`);
        console.log('\nExiting Program...')
        this.saveCurrentFloor();
        process.exit();
    }

    closeDoor(){
        console.log('Door closes');
        this.isDoorOpen = false;
    }

    async waitForUserSelection(timeoutSeconds){
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
    
            let timerExpired = false;
    
            const timeout = setTimeout(() => {
                timerExpired = true;
                console.log("\nTime's up! No input detected.");
                rl.close();
                resolve(false);
            }, timeoutSeconds * 1000);
    
            const promptUser = () => {
                rl.question(`\nSelect a floor (0 to ${this.totalFloors - 1}): `, (answer) => {
                    if (timerExpired) {
                        rl.close();
                        resolve(false);
                        return;
                    }
    
                    const floor = parseInt(answer, 10);
                    if (isNaN(floor) || floor < 0 || floor > this.totalFloors-1) {
                        console.log('Invalid floor selection. Please try again.');
                        promptUser(); 
                    } else {
                        clearTimeout(timeout);
                        this.floorToReach.push(floor);
                        rl.close();
                        resolve(true);
                    }
                });
            };

            promptUser();
        });

        // const input = prompt(`Select a floor (0 to ${this.totalFloors - 1}): `);
        // const floor = parseInt(input, 10);  
        // if(isNaN(floor) || floor < 0 || floor > 4 || floor > this.totalFloors){
        //     console.log('Invalid floor selection');
        //     this.waitForUserSelection();
        //     return ;
        // }
        // this.floorToReach.push(floor);
    } 

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const lift = new LiftSystem(5, 2);


class User{
    constructor(userPlace){
        this.userPlace = userPlace;
    }

    callLift(lift){
        lift.requestLift(this.userPlace)
    }
}

const user = new User(5);

class Controller{
    constructor(lift, user){
        this.lift = lift;
        this.user = user;
    }

    handleUserRequest() {
        this.user.callLift(this.lift);
    }
}

const controller = new Controller(lift , user);

console.log("Lift System Simulation");
controller.handleUserRequest();