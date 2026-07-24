import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav>
            <ul className="flex justify-center list-none p-4 items-center gap-1">
                <li>
                    <button
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`py-2 px-3 rounded-md transition-colors flex items-center gap-1.5 text-sm
                            ${currentPage === 1
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <FaChevronLeft className="h-3 w-3" />
                        <span>Previous</span>
                    </button>
                </li>

                {pageNumbers.map(number => (
                    <li key={number}>
                        <button
                            onClick={() => paginate(number)}
                            className={`py-2 px-3.5 rounded-md text-sm font-medium transition-colors
                                ${currentPage === number
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {number}
                        </button>
                    </li>
                ))}

                <li>
                    <button
                        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`py-2 px-3 rounded-md transition-colors flex items-center gap-1.5 text-sm
                            ${currentPage === totalPages
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <span>Next</span>
                        <FaChevronRight className="h-3 w-3" />
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;
