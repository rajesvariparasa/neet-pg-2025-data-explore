# 🩺 NEET PG 2025 Data Explorer

An independent interactive explorer for **NEET PG 2025 counselling and seat allotment data**, compiled from publicly available Medical Counselling Committee (MCC) documents.

## 🔎 Live Website

👉 **[Open the NEET PG 2025 Data Explorer](https://rajesvariparasa.github.io/neet-pg-2025-data-explore/)**

💻 **[View the source code on GitHub](https://github.com/rajesvariparasa/neet-pg-2025-data-explore)**

## 📊 What can you explore?

* NEET PG 2025 rank and seat allotment data
* College / institute and course
* Counselling round
* Allotment quota
* Allotment and candidate category
* Final assignment for each rank
* Rank ranges and filtered results

The dataset contains **66,000+ allotment records**, covering **41,000+ unique ranks across three counselling rounds**.

## ⭐ What does "Final Assignment" mean?

**Final Assignment** identifies the last recorded counselling round in which a rank received an allotment.

For example, if a candidate appears in Rounds 1 and 3, the Round 3 record is marked as the **Final Assignment**. This helps users examine the final recorded allotment after the counselling rounds represented in the dataset.

## ❓ Frequently Asked Questions

### 🔎 What is the NEET PG 2025 Data Explorer?

It is an independent web-based tool for exploring NEET PG 2025 counselling and seat allotment data in a searchable and filterable format.

### 🏛️ Is this an official MCC website?

No. This is an **independent project** and is not affiliated with, endorsed by, or operated by the Medical Counselling Committee (MCC).

### 📄 Where does the NEET PG 2025 data come from?

The dataset is compiled from publicly available **MCC counselling documents and seat-allotment PDFs**. The extracted data is checked against the source material on a best-effort basis.

### 📈 How many NEET PG 2025 allotment records are included?

The current dataset contains **66,000+ allotment records** and **41,000+ unique ranks**, covering three counselling rounds.

### 🔢 Can I search for a specific NEET PG rank?

Yes. You can filter the data by rank or rank range and combine it with filters such as counselling round, course, quota, category, and institute.

### ⭐ Can I see the final college/course allotted to a rank?

Yes. Enable **Final Assignment Only** to view the final recorded allotment for each rank represented in the dataset.

### ⚠️ Does Final Assignment mean the candidate's current or actual admission status?

Not necessarily. It represents the final allotment recorded in the dataset based on the counselling rounds included. It should not be interpreted as confirmation of admission, joining, or current status.

### ✅ Is the data guaranteed to be accurate?

No. The data has been extracted and checked on a best-effort basis, but **accuracy, completeness, and interpretation cannot be guaranteed**. Users should verify important information against the latest official MCC documents.

### 💾 Where can I get the extracted dataset?

The extracted dataset is available as [`data.csv`](./data.csv) in this repository. The data extraction codebook can be found here [`neet_pg_counselling_data_extraction_from_pdfs.ipynb`](./neet_pg_counselling_data_extraction_from_pdfs.ipynb).

### 🐛 Where can I report a possible data error?

If you find a discrepancy, please report it through the project's GitHub repository with the rank, round, relevant record, and source document if available.

## 🔗 Data & Sources

**Independent data explorer — not an MCC website.**

This project is intended for **data exploration and analysis only**. It is not affiliated with or endorsed by MCC.

The dataset is independently extracted from publicly available MCC documents and checked against source material on a best-effort basis. Accuracy, completeness, and timeliness cannot be guaranteed.

For counselling decisions, seat availability, eligibility, allotment status, or other important information, **always verify the latest information with the official MCC website and original counselling documents**.

**Data flow:**

📄 MCC source documents → 🧹 Independently extracted dataset → 🔎 Interactive data explorer

## 🌐 Project Links

* **[Live Data Explorer](https://rajesvariparasa.github.io/neet-pg-2025-data-explore/)**
* **[GitHub Repository](https://github.com/rajesvariparasa/neet-pg-2025-data-explore)**
* **[Official MCC Website](https://mcc.nic.in/)**
* **[Data Extraction Notebook](./neet_pg_counselling_data_extraction_from_pdfs.ipynb)** 
* **[Extracted Dataset](./data.csv)**

## 🛠️ Built With

HTML · CSS · JavaScript · Bootstrap · DataTables · PapaParse

