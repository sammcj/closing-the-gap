# LLM Benchmark Visualisations

**!!DISCLAIMER: This is work in progress experiment in early alpha stages, there's a lot of work to be done to make this a useful tool!!**

This project is designed to visualise and track the performance of various Large Language Models (LLMs) across different benchmarks. The visualisations aim help in understanding trends, comparing models, and predicting future performances.

## Features

- **Data Entry**: Easily add new benchmark data for models.
- **Visualisation**: Interactive charts showing model performance over time.
- **Predictive Analysis**: Predict future performances based on historical data.

## Getting Started

### Prerequisites

- Node.js (v22+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sammcj/closing-the-gap.git
   cd closing-the-gap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Access the application in your browser at `http://localhost:3000`.

## Project Structure

The project is structured as follows:

- **`public/`**: Static files and JSON data for models, benchmarks, and results.
  - `models.json`: List of available models with their details.
  - `benchmarks.json`: List of available benchmarks.
  - `results.json`: Historical benchmark scores for different models.
- **`src/`**: Source code for the application.
  - **`components/`**: Reusable UI components.
    - `DataEntryForm.js`: Form to add new benchmark data.
    - `LLMBenchmarkVisualisation.js`: Component to visualise benchmark data using ChartJS.
  - **`config.js`**: Configuration settings for the application, including chart colors and titles.
  - **`App.js`**: Main application component that integrates all other components.
- **`server.js`**: Express server to serve static files and API endpoints.
- **`package.json`**: Project metadata and scripts.

## Usage

1. **Data Entry**: Use the `DataEntryForm` component to add new benchmark data for models. This includes entering dates, selecting models, benchmarks, scores, and whether the model is open or closed.

2. **Visualisation**: The `LLMBenchmarkVisualisation` component provides interactive charts that show the performance of different models over time. Predictions are also provided based on historical data trends.

3. **Predictive Analysis**: Historical data is used to predict future performances, helping in understanding model growth and potential improvements.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and test them thoroughly.
4. Submit a pull request with a clear description of your changes.

## License

Copyright 2024 Sam McLeod

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
