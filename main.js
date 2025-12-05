require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// MongoDB Vault model
const Vault = require('./data/vault');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Backup function
const backupVault = async () => {
  try {
    const data = await Vault.find();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const backupPath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`✅ Backup created: ${backupPath}`);
  } catch (err) {
    console.error('Backup error:', err);
  }
};

// Main menu function
async function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Vault Data
8. Vault Statistics
9. Exit
=====================
  `);

  rl.question('Choose option: ', async ans => {
    switch (ans.trim()) {

      // Add Record
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', async value => {
            const record = new Vault({
              name,
              id: Date.now().toString(),
              date: new Date(),
              data: value
            });
            await record.save();
            console.log('✅ Record added successfully!');
            await backupVault();
            menu();
          });
        });
        break;

      // List Records
      case '2':
        {
          const records = await Vault.find();
          if (records.length === 0) console.log('No records found.');
          else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.data} | Created: ${r.date}`));
          menu();
        }
        break;

      // Update Record
      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', async value => {
              const updated = await Vault.findOneAndUpdate({ id }, { name, data: value, updatedAt: new Date() });
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              await backupVault();
              menu();
            });
          });
        });
        break;

      // Delete Record
      case '4':
        rl.question('Enter record ID to delete: ', async id => {
          const deleted = await Vault.findOneAndDelete({ id });
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          await backupVault();
          menu();
        });
        break;

      // Search Records
      case '5':
        rl.question('Enter search keyword: ', async keyword => {
          const results = await Vault.find({
            name: { $regex: keyword.trim(), $options: 'i' }
          });
          if (results.length === 0) console.log('No records found.');
          else {
            console.log(`Found ${results.length} matching record(s):`);
            results.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.data} | Created: ${r.date}`));
          }
          menu();
        });
        break;

      // Sort Records
      case '6':
        rl.question('Sort by (name/date): ', async fieldInput => {
          const field = fieldInput.trim().toLowerCase() === 'date' ? 'date' : 'name';
          rl.question('Order (asc/desc): ', async orderInput => {
            const order = orderInput.trim().toLowerCase() === 'desc' ? -1 : 1;
            const sorted = await Vault.find().sort({ [field]: order });
            if (sorted.length === 0) console.log('No records found.');
            else sorted.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.data} | Created: ${r.date}`));
            menu();
          });
        });
        break;

      // Export Vault Data
      case '7':
        {
          const data = await Vault.find();
          if (data.length === 0) console.log('No records to export.');
          else {
            const now = new Date().toISOString();
            const fileName = `export_${now}.txt`;
            const filePath = path.join(__dirname, fileName);
            let content = `Exported on ${now}\nTotal records: ${data.length}\n\n`;
            data.forEach(r => {
              content += `ID: ${r.id} | Name: ${r.name} | Value: ${r.data} | Created: ${r.date}\n`;
            });
            fs.writeFileSync(filePath, content);
            console.log(`✅ Data exported successfully to ${fileName}`);
          }
          menu();
        }
        break;

      // Vault Statistics
      case '8':
        {
          const statsData = await Vault.find();
          if (statsData.length === 0) console.log('No records to display statistics.');
          else {
            const total = statsData.length;
            const lastModified = statsData.sort((a, b) => b.updatedAt - a.updatedAt)[0]?.updatedAt;
            const longestName = statsData.sort((a, b) => b.name.length - a.name.length)[0]?.name;
            const earliestDate = statsData.sort((a, b) => a.date - b.date)[0]?.date;
            const latestDate = statsData.sort((a, b) => b.date - a.date)[0]?.date;

            console.log('Vault Statistics:');
            console.log('--------------------------');
            console.log(`Total Records: ${total}`);
            console.log(`Last Modified: ${lastModified}`);
            console.log(`Longest Name: ${longestName} (${longestName.length} characters)`);
            console.log(`Earliest Record: ${earliestDate}`);
            console.log(`Latest Record: ${latestDate}`);
          }
          menu();
        }
        break;

      // Exit
      case '9':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        mongoose.disconnect();
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

// Start menu
menu();
