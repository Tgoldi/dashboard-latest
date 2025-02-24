import 'dotenv/config';
import { vapiService } from '../lib/vapi';

async function syncAssistants() {
    console.log('Starting assistant sync...');
    try {
        await vapiService.assistants.sync();
        console.log('Assistant sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing assistants:', error);
        process.exit(1);
    }
}

syncAssistants();
