Rayda: Product Requirements Document (PRD)
Version: 0.1
Date: August 7, 2025
Status: Inception

1. Introduction
1.1. Project Overview
The Marmaray Train Tracker is an open-source web application designed to provide Istanbul residents and visitors with a real-time simulation of the Marmaray train line's operations. Since an official, public real-time data feed of train locations is not available, this application will leverage publicly accessible schedule data, station locations, and inter-station travel times to calculate and visualize the estimated positions of all active trains.

1.2. Problem Statement
Commuters on the Marmaray line lack a visual tool to understand the current flow and estimated locations of trains. While timetables are available, they don't provide an intuitive, at-a-glance overview of the system's status, especially considering the multiple overlapping service patterns. This makes it difficult to visualize train distribution and estimate arrival times.

1.3. Target Audience
Daily Commuters: Regular users of the Marmaray line who want to better plan their journeys.

Tourists & Visitors: Individuals unfamiliar with the Marmaray system who would benefit from a visual guide to the train line.

Urban Mobility Enthusiasts: Individuals interested in Istanbul's public transport infrastructure.

1.4. Scope
This project is focused on creating a client-side web application that simulates train positions based on a fixed schedule. It is not intended to reflect real-time disruptions, delays, or service changes that are not part of the standard schedule.

2. Goals and Objectives
User Goal: To provide a simple, visual, and intuitive way for users to see the estimated locations of all Marmaray trains and get upcoming arrival times for any station, reflecting the different service routes.

Project Goal: To create a useful, open-source tool for the Istanbul community and a showcase project demonstrating how to build a real-time simulation from static schedule data with multiple route patterns.

3. Features & Functionality
3.1. Core Features (MVP - Minimum Viable Product)
Feature 1: Interactive Route Map

Description: Display the full Marmaray line on an interactive map. The map will show all 43 stations, clearly labeled. The train route will be visually distinct.

User Story: As a user, I want to see the entire Marmaray route and all its stations on a map so I can understand the train's path.

Feature 2: Real-Time Train Simulation

Description: Animated icons representing individual trains will move along the map route. Their positions will be calculated based on the current time and the official schedules for all distinct route patterns. Icons will represent trains moving in both directions.

User Story: As a user, I want to see icons for all active trains moving along the line so I can visualize the current state of the service.

Feature 3: Station-Specific Timetable

Description: Users can click on any station icon on the map or select a station from a dropdown list. Upon selection, a panel will display the next 3-4 estimated arrival times for that station, for trains heading in both directions. The timetable will correctly aggregate arrivals from all applicable routes.

User Story: As a user, I want to select my current station and see the estimated arrival times for the next few trains so I can plan when to go to the platform.

Feature 4: Directional & Route Information

Description: The UI will clearly distinguish between the two directions of travel (e.g., towards Gebze, towards Halkalı). Train icons on the map could potentially indicate their final destination upon hover/click.

User Story: As a user, I need to easily tell which direction a train is going and where it terminates so I don't get on the wrong one.

3.2. Future Enhancements (Post-MVP)
Real-time Disruption Info: Integrate a manual override or a feed (if one ever becomes available) to show service alerts or disruptions.

Travel Time Calculator: Allow users to select a start and end station to get an estimated travel time and fare.

Multi-language Support: Add support for Turkish and other languages.

User Location: Allow the app to use the device's GPS to automatically identify the nearest Marmaray station.

4. Data & Technical Specifications
4.1. Data Sources
The application will be built using the following static data, which will be hardcoded into the application:

Station List: An array of all 43 Marmaray stations, including their names and geographic coordinates (latitude, longitude).

Route Geometry: A set of coordinates defining the path of the Marmaray line for drawing on the map.

Inter-Station Distances/Times: A data structure containing the travel time or distance between each consecutive station.

Schedule Patterns: (Updated) An array of objects, where each object defines a specific route pattern. This is critical for an accurate simulation.

Route 1:

Name: Halkalı ↔ Gebze

Termini: ['Halkalı', 'Gebze']

Frequency: 15 minutes

Route 2:

Name: Ataköy ↔ Pendik

Termini: ['Ataköy', 'Pendik']

Frequency: 8 minutes

4.2. Technical Approach
Frontend Framework: React.

Mapping Library: A suitable mapping library like Leaflet or Mapbox GL JS will be used to render the map and train icons.

Simulation Logic: (Updated)

The application will generate separate timetables for each defined route pattern (e.g., Halkalı-Gebze, Ataköy-Pendik) in memory upon loading. It will create lists of all train journeys for the day, with departure times from each route's specific terminus.

A central clock (using setInterval) will tick every second.

On each tick, the application will iterate through every scheduled train journey across all route patterns.

For each train, it will calculate its elapsed_time_since_departure.

Using the inter-station travel time data, it will determine which two stations the train is currently between and its progress along that segment.

This progress will be translated into a geographical coordinate for placing the train's icon on the map.

The station timetable will be calculated by projecting future positions of all trains relative to the selected station and aggregating the results.

5. Design & User Experience (UX)
UI Principles: Clean, modern, and intuitive. The interface should be easily understandable with minimal clutter.

Mobile-First: The design must be fully responsive and optimized for mobile devices, as this will be the primary use case.

Interactivity: Map interactions (panning, zooming) and station selections should be smooth and responsive.

Visual Cues: Use clear icons and colors to distinguish between train directions and other map elements.

6. Success Metrics
User Adoption: Number of unique visitors and page views.

Community Engagement: Number of forks, stars, and contributions to the open-source GitHub repository.

User Feedback: Positive feedback and feature requests from the community.
