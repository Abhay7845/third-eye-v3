import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

load_dotenv('.env')

DB_HOST= os.getenv('DB_HOSTNAME')
DB_PORT=os.getenv('DB_PROT')
DB_NAME=os.getenv('DB_NAME')
DB_USER=os.getenv('DB_USERNAME')
DB_PASSWORD=os.getenv('DB_PASSWORD')


DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL,pool_pre_ping=True,pool_recycle=3600)

SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()