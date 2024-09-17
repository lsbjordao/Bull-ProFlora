# Bull-ProFlora

The Bull-ProFlora software is currently under review for publication in a scientific journal. Stay tuned for updates!

## Overview

**Bull-ProFlora** is a system developed at the *Centro Nacional de Conservação da Flora* ([CNCFlora](http://cncflora.jbrj.gov.br/)), a division of the Rio de Janeiro Botanical Garden ([JBRJ](https://www.gov.br/jbrj/)). Its purpose is to streamline and support the process of assessing the extinction risk of species in the Brazilian flora. By automating workflows and managing large data volumes efficiently, Bull-ProFlora ensures that the assessment process is faster, scalable, and more reliable.

## Why Bull-ProFlora?

The need for an automated system like Bull-ProFlora arises from the increasing volume of species assessments required for conservation efforts in Brazil. Manual processes are time-consuming, prone to error, and challenging to scale. This system addresses these challenges by automating key stages in the workflow, reducing the need for human intervention, and ensuring the accuracy and consistency of assessments.

## How Does It Work?

Bull-ProFlora operates using a **job message queue system**, allowing it to handle multiple tasks concurrently and efficiently. The queue-based architecture enables the distribution of workload across different stages of the assessment process, ensuring that jobs are processed in the correct order and handled in parallel when possible. 

Species records, including occurrence data and geographical coordinates, are validated by experts before being processed further. Once validated, the records enter the Bull-ProFlora system, where they are systematically processed, with results delivered back into the [ProFlora](https://proflora.jbrj.gov.br/) system.

## What’s Under the Hood?

The system is powered by the following technologies:
- **[Node.js](https://nodejs.org/)**: The runtime environment for executing JavaScript server-side.
- **[Nest.js](https://nestjs.com/)**: A progressive Node.js framework for building scalable applications.
- **[Bull](https://github.com/OptimalBits/bull)**: A job queue system using Redis as a fast, in-memory database for handling message queuing.
- **[BullMQ](https://docs.bullmq.io/)**: A modern message queue system built on top of Redis, used for managing queues at scale.
- **[Bull-board](https://github.com/felixmosh/bull-board)**: A real-time monitoring tool that allows visualization of the jobs being processed.

## Is It Reproducible and Replicable?

Yes, Bull-ProFlora was designed with reproducibility and scalability in mind. The system’s architecture is modular and can be adapted to different environments, allowing other institutions or organizations to replicate its functionality for similar species conservation tasks.

## What's Next?

Bull-ProFlora continues to evolve. Future developments include:
- Integration with additional data sources to enhance the scope and accuracy of assessments.
- Improved monitoring and analytics for better insights into job processing.
- Enhance integration with the ProFlora system to minimize repetitive tasks by automating the transfer of data from Bull-ProFlora.
