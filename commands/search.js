const { SlashCommandBuilder } = require('discord.js');
const torRequest = require('tor-request');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search the Tor network')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The term to search on Tor')
        .setRequired(true)),
  async execute(interaction) {
    const query = interaction.options.getString('query');
    
    // Set Tor address, adjust port if necessary
    torRequest.setTorAddress('127.0.0.1', 9050); // Ensure Tor is running

    // Perform the search request using tor-request
    torRequest.request(`http://torsearchengine.com/search?q=${encodeURIComponent(query)}`, async (err, response, body) => {
      if (err) {
        console.error(err);
        return interaction.reply('Error performing search.');
      }
      
      try {
        // Parse and format results based on response structure
        const results = JSON.parse(body).results.slice(0, 3); // Adjust as needed
        const resultMessage = results.map(result => `${result.title} - ${result.url}`).join('\n');
        
        await interaction.reply(resultMessage || 'No results found.');
      } catch (error) {
        console.error(error);
        await interaction.reply('Error processing search results.');
      }
    });
  },
};
