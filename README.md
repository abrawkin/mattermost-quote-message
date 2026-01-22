# Mattermost Quote Message Plugin

A simple and efficient Mattermost plugin that allows users to quote messages directly in conversations.

<img width="396" height="392" alt="image" src="https://github.com/user-attachments/assets/4d6bd523-9d77-4515-a664-e9f76509f885" />


## Features
- Quick quote functionality from post dropdown menu
- Automatic Markdown formatting with author attribution
- Support for non-system messages
- Real-time quote insertion into message composer

## Requirements
- Mattermost v9 or compatible versions
- Go (for server development)
- Node.js and npm (for webapp development)

## Installation

1. Download the latest release from the releases page
2. Upload the plugin through Mattermost System Console
3. Enable the plugin in your Mattermost instance

## Development

To build the plugin:

1. Build server:
```bash
make server
```

2. Build webapp:
```bash
cd webapp
npm install
npm run build
```

3. Package plugin:
```bash
make package
```

The packaged plugin will be available in the `dist/` directory.

## Usage

1. Hover over any message you want to quote
2. Click on the "Message Action" icon (four small squares) <br>
<img alt="image" src="https://downloader.disk.yandex.ru/preview/dd4a50b466babb661a6ae1a01f09e37505d3534371951cb679bf5c18aac29f74/6972537f/njHbbXdzOyI6VaEjwSjFIjiOqpXDDSGmNKj-zB8A05yExqt3ftdrN90J_4zSreBjAbMQQUxTZ9IQasUzprG1lw%3D%3D?uid=0&filename=4sq.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=0&tknv=v3&size=2048x2048" /> 
4. Select "Quote message"<br>
5. The quoted message will appear in your composer with proper formatting

## Contributing

Contributions are welcome! Some areas for improvement:
- Custom formatting options
- Keyboard shortcuts
- Multi-message quoting

## License

This project is licensed under the MIT License - see the LICENSE file for details.
