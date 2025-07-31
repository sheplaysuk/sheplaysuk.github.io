# Static Version of She Plays Project

This repository contains a static version of the She Plays project, which allows users to find local sports clubs. The static version uses JSON files for data and includes HTML, CSS, and JavaScript files for the frontend.

## Project Structure

```
static-version
├── data
│   ├── clubs.json
│   ├── leagues.json
│   ├── locations.json
│   └── sports.json
├── css
│   └── style.css
├── js
│   └── main.js
├── index.html
└── README.md
```

## Files Description

- **data/clubs.json**: Contains an array of club objects with properties such as `id`, `name`, `location`, `league`, `age_group`, `logo`, `address`, `email`, and `social_link`.

- **data/leagues.json**: Contains an array of league objects with properties `id` and `name`.

- **data/locations.json**: Contains an array of strings representing different club locations.

- **data/sports.json**: Contains an array of sport objects with properties `id` and `name`.

- **css/style.css**: Contains the CSS styles for the static HTML pages, defining layout, colors, fonts, and other visual elements.

- **js/main.js**: Contains JavaScript code to handle interactivity on the static HTML page, such as fetching data from the JSON files and dynamically rendering club information.

- **index.html**: The main HTML page that serves as the entry point for the static version of the project. It includes links to the CSS and JavaScript files and structures the layout for displaying clubs, leagues, locations, and sports.

## Setup Instructions

1. Clone the repository to your local machine.
2. Open the `index.html` file in a web browser to view the static version of the project.
3. Ensure that the JSON files in the `data` directory are correctly formatted to reflect the necessary data structure.

## Usage

- The static version allows users to view clubs, leagues, locations, and sports without needing a backend server.
- Interactivity is handled through JavaScript, which fetches data from the JSON files and updates the HTML content dynamically.

Feel free to modify the CSS and JavaScript files to customize the appearance and functionality of the static version.