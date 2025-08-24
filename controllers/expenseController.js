import firebase from "../firebase.js";
import Expense from "../models/ExpenseModel.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    startAfter,
    limit,
    Timestamp,
    and,
    where
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createExpense = async (req, res, _next) => {
    try {
        const data = req.body;
        data.date = data.date ? new Date(data.date) : new Date();

        const docRef = await addDoc(collection(db, 'expenses'), data);
        const doc = await getDoc(docRef);
        res.status(200).send(new Expense(doc.id, doc.data().amount, doc.data().category, doc.data().date));
    } catch (error) {
        res.status(400).send(error.message);
    };
};

export const getExpenses = async (req, res, _next) => {
    try {
        const dataLimit = req.query.limit ? parseInt(req.query.limit) : null;
        let lastDate = req.query.lastDate ? JSON.parse(req.query.lastDate) : null;
        let lastId = req.query.lastId ? req.query.lastId : null;

        let qry = query(
            collection(db, 'expenses'),
            orderBy('date', 'desc'),
            orderBy('__name__'),
            limit(dataLimit + 1));
        if (lastDate && lastId) {
            lastDate = new Timestamp(lastDate.seconds, lastDate.nanoseconds)
            qry = query(
                collection(db, 'expenses'),
                orderBy('date', 'desc'),
                orderBy("__name__"),
                startAfter(lastDate, lastId),
                limit(dataLimit + 1));
        }

        const snapshot = await getDocs(qry);
        const hasMore = snapshot.size > dataLimit;
        const expenses = [];

        if (snapshot.empty) {
            res.status(404).send('No expenses found');
        } else {
            const sliced = hasMore ? snapshot.docs.slice(0, dataLimit) : snapshot.docs;

            sliced.forEach((doc) => {
                const expense = new Expense(
                    doc.id,
                    doc.data().amount,
                    doc.data().category,
                    doc.data().date
                );
                expenses.push(expense);
            });

            res.status(200).send({ 'expenses': expenses, 'hasMore': hasMore });
        }
    } catch (error) {
        res.status(400).send('Error: ' + error.message);
    }
};

export const getRecentExpenses = async (req, res) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0);

    const expenseRef = collection(db, 'expenses');
    const qry = query(expenseRef, and(
        where('date', '>=', startDate),
        where('date', '<', endDate)
    ))

    const snapshot = await getDocs(qry);

    res.send(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })));
}

export const updateExpense = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const expenseRef = doc(db, 'expenses', id);

        data.date = data.date ? new Date(data.date) : new Date();

        await updateDoc(expenseRef, data);
        const updated = await getDoc(expenseRef);

        res.status(200).send(new Expense(updated.id, updated.data().amount, updated.data().category, updated.data().date));
    } catch (error) {
        res.status(400).send(error.message);
    }
}

function getRandomCategory(categories) {
    const index = Math.floor(Math.random() * categories.length);
    return categories[index];
}

export const updateAllExpenses = async (req, res) => {
    const categories = ["Housing",
        "Transportation",
        "Food",
        "Utilities",
        "Clothing",
        "Medical/Healthcare",
        "Insurance",
        "Household Items/Supplies",
        "Personal",
        "Debt",
        "Education",
        "Savings",
        "Gifts/Donations",
        "Entartainment"];

    const expensesRef = collection(db, 'expenses');
    const snapshot = await getDocs(expensesRef);
    snapshot.forEach(async (doc, ind) => {

        await updateDoc(doc.ref, { "category": getRandomCategory(categories) });
    })
    res.send("Ok");
}
export const deleteExpense = async (req, res, next) => {
    try {
        const id = req.params.id;
        const docRef = doc(db, 'expenses', id);
        const expense = await getDoc(docRef);

        if (!expense.exists()) {
            res.status(404).send('Expense not found');
        } else {
            await deleteDoc(docRef);
            res.status(204).send('Expense deleted successfully');
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}